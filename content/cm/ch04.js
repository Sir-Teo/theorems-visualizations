// Condensed Matter Physics — Chapter 4: Semiconductors and devices (items 4.1–4.6; 4.7–4.12 in ch04-b.js)
import { PI, KB, MAT, eg, Nc, Nv, niB, fdHalf, np, solveMu } from './ch04.shared.js';
import { MATERIALS, gapA, densityC, densityV, intrinsicA, fermiA, neutralityA, dopingRegime, impurityA, BAND_MODELS, conductionA, absorptionA, indirectA } from './cm-source-audit-carriers.js';

// ---------------------------------------------------------------------------------------------- helpers for 4.1
// Toy band structures along Γ → zone edge (k in units of the Γ–X or Γ–L distance), energies in eV; valence band top at 0.
const BANDS=BAND_MODELS;
const VB_HEAVY=1.0,VB_LIGHT=2.5,cbE=conductionA;
const alphaModel=(b,E,kT)=>absorptionA(b,E,kT).total;

// ---------------------------------------------------------------------------------------------- helpers for 4.4
/** Draw the (001) projection of the diamond/zinc-blende lattice: atoms at (i, j) a/4 with i + j even. */
function drawLattice(s, v, a, R) {
  const ctx = s.ctx, d = a / 4, px = Math.abs(s.X(d) - s.X(0));
  ctx.save();
  if (px >= 3.2) {
    ctx.fillStyle = v.color('muted', 0.7);
    const n = Math.ceil(R / d) + 1, r = Math.min(2.2, px / 3);
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) if (!((i + j) & 1)) ctx.fillRect(s.X(i * d) - r, s.Y(j * d) - r, 2 * r, 2 * r);
  } else {
    // too fine to resolve: draw a grid of whole numbers of cubic cells instead
    let m = 1; while (Math.abs(s.X(m * a) - s.X(0)) < 18) m *= 2;
    ctx.strokeStyle = v.color('grid', 0.9); ctx.lineWidth = 1; ctx.beginPath();
    for (let q = -Math.ceil(R / (m * a)); q <= Math.ceil(R / (m * a)); q++) { const X = s.X(q * m * a), Y = s.Y(q * m * a); ctx.moveTo(X, s.Y(-R)); ctx.lineTo(X, s.Y(R)); ctx.moveTo(s.X(-R), Y); ctx.lineTo(s.X(R), Y); }
    ctx.stroke();
    s.text(`grid: ${m} unit cell${m > 1 ? 's' : ''} (lattice too fine to draw)`, -R * 0.96, -R * 0.93, { size: 10, color: 'muted' });
  }
  ctx.restore();
}

/** Slider label for log-scale densities: 3.2×10¹⁶ */
const dens = (M) => (x) => { const k = Math.floor(Math.log10(x) + 1e-9), m = x / 10 ** k; return (Math.abs(m - 1) < 0.01 ? '' : m.toFixed(1) + '×') + M.pow10Text(k); };

export default {
  collection: 'cm',
  chapter: 4,
  title: 'Semiconductors and devices',
  summary: String.raw`In a semiconductor the gap is small enough that temperature and impurities control the carrier densities: their product is fixed by the gap, and dopants behave like scaled-up hydrogen atoms. Carriers drift in fields and diffuse down gradients, tied together by the Einstein relation. Joining p- and n-type material builds a depletion layer and a built-in field, giving the diode’s exponential current–voltage curve and, from there, light-emitting diodes, field-effect transistors, quantum wells and excitons (solar cells and their efficiency limit are developed in energy).`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Direct and indirect band gaps',
      credit: 'Parabolic-band optical-transition model',
      statement: String.raw`The **band gap** $E_g$ is the energy between the top of the valence band and the bottom of the conduction band. The gap is **direct** if both extremes occur at the same crystal momentum $\mathbf k$ (GaAs: both at $\Gamma$) and **indirect** if they do not (Si: conduction minimum between $\Gamma$ and $X$; Ge: at $L$). A photon carries momentum $\hbar\omega/c$, tiny compared with a Brillouin-zone dimension $\sim\pi/a$, so neglecting its small momentum gives an approximately **vertical** transition. For dipole-allowed transitions with parabolic 3D bands and slowly varying matrix elements, absorption across a direct gap starts as $\alpha\propto\sqrt{\hbar\omega-E_g}$, while across an indirect gap it needs a phonon to supply the missing $\Delta\mathbf k$, so it is a second-order process with a weak, gradual edge, $\alpha\propto(\hbar\omega-E_g\pm\hbar\Omega)^2$.`,
      idea: String.raw`Crystal momentum is conserved up to a reciprocal-lattice vector in every process (Bloch's theorem, qm-9.7), and a visible photon has $k\sim10^{-3}$ of the zone size, so a lone photon moves an electron straight up in the band diagram. If the conduction minimum sits elsewhere, the electron must also exchange a phonon, whose energy ($\sim$ tens of meV) is small but whose momentum is of the order of the zone size. Requiring two particles to take part, with the electron–phonon coupling as a perturbation, lowers the absorption rate by orders of magnitude. The same selection rule runs backwards: an electron at the conduction minimum of an indirect semiconductor cannot drop vertically, so recombination needs a phonon (or a defect) and is slow.`,
      caption: String.raw`Choose a material-inspired band model and photon energy. Left: schematic parabolic bands, with a vertical photon arrow and, when a final state is represented, a phonon arrow satisfying the chosen emission/absorption energy balance. A final state outside the drawn branch is reported rather than clamped to a different energy. Right: direct and phonon-assisted absorption models. The prefactors, curvature, phonon energies and selected silicon valley position are illustrative; these curves are not calibrated absorption measurements. A zero coefficient has no log coordinate, so its marker rests on the labeled plotting floor.`,
      scope: String.raw`Ideal crystal, dipole-allowed parabolic bands and constant matrix elements; excitons, tails, disorder-assisted transitions and real band anisotropy are omitted. Rounded 300 K gaps follow the Ioffe institutional band summaries: GaAs 1.424 eV direct, Si 1.12 eV indirect with direct 3.4 eV, Ge 0.66 eV indirect with direct 0.80 eV. Only GaAs's additional X offset 0.48 eV is retained; its L valley is not drawn. The material curves combine these gap values with explicitly assumed model parameters, not an independent data fit.`,
      deps: ['qm-10.13', 'cm-2.3'],
      refs: ['Chenming Hu, Modern Semiconductor Devices for Integrated Circuits, §§1.3,4.12.2,4.13.1', 'Ioffe NSM Archive, Si/Ge/GaAs band structure, Basic Parameters; edge powers independently derived from 3D parabolic joint densities of states'],
      tags: ['band gap', 'direct', 'indirect', 'absorption'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Direct_and_indirect_band_gaps' },
      verify: false,
      viz(v) {
        const mat = v.select('material', [{ value: 'GaAs', label: 'GaAs (direct)' }, { value: 'Si', label: 'Si (indirect)' }, { value: 'Ge', label: 'Ge (indirect)' }], 'Si');
        const hw = v.slider('photon energy $\\hbar\\omega$ (eV)', 0.3, 4, 1.45, { step: 0.01 });
        const sB = v.stage({ x: [-1.05, 1.05], y: [-2.6, 4.4], axes: 'box', gutter: true, height: 360, xlabel: 'crystal momentum $k$ (Γ at centre)', ylabel: 'energy $E$ (eV)', xticks: [[-1, '−X'], [0, 'Γ'], [1, 'X']], title: 'bands and the optical transition', weight: 1.1 });
        const sA = v.stage({ x: [0.3, 4], y: [0.3, 1e6], ylog: true, axes: 'box', gutter: true, height: 360, xlabel: 'photon energy $\\hbar\\omega$ (eV)', ylabel: 'absorption $\\alpha$ (cm$^{-1}$)', title: 'absorption edge (model)', weight: 1 });
        const hA = sA.handle(1.45, 1e3, { color: 'gold', r: 7, constrain: (x) => { const E = Math.max(0.3, Math.min(4, x)); const b = BANDS[mat.value]; return [E, Math.max(.3, alphaModel(b, E))]; } });
        hA.onDrag = () => hw.set(Math.round(hA.x * 100) / 100);
        v.legend([['accent', 'conduction valleys'], ['green', 'valence bands'], ['gold', 'photon'], ['red', 'phonon']]);
        let info = {};
        v.render(() => {
          const b = BANDS[mat.value], E = hw.value; sB.setTicks([[-1,'−'+b.edge],[0,'Γ'],[1,b.edge]]);sB.setView([-1.05,1.05],[-2.6,Math.max(4.4,E+.2)]);
          for (const [a, c] of [[VB_HEAVY, 'green'], [VB_LIGHT, 'green']]) sB.fn((k) => -a * k * k, { color: c, width: a === VB_HEAVY ? 2.6 : 1.6, alpha: a === VB_HEAVY ? 1 : 0.7, domain: [-1, 1] });
          b.valleys.forEach((val, i) => { const st = { color: 'accent', width: i === 0 ? 2.8 : 1.6, alpha: i === 0 ? 1 : 0.65 }; if (val.dom) { sB.fn((k) => cbE(val, k), { ...st, domain: val.dom }); sB.fn((k) => cbE(val, k), { ...st, domain: [-val.dom[1], -val.dom[0]] }); } else sB.fn((k) => cbE(val, k), { ...st, domain: [-1, 1] }); });
          if (mat.value === 'GaAs') sB.text('X valley', 0.62, 2.12, { size: 10, color: 'muted' });
          // gap markers
          const min = b.valleys[0], gap = min.E0;
          sB.dot(0, 0, { r: 5, color: 'green' }); sB.dot(min.k0, min.E0, { r: 5, color: 'accent' }); if (min.k0 > 0) sB.dot(-min.k0, min.E0, { r: 5, color: 'accent' });
          sB.hline(gap, { color: 'faint', width: 1, dash: [3, 4] });
          sB.text(`$E_g=${gap.toFixed(2)}$ eV`, 0.0, gap - 0.28, { size: 11, color: 'muted', align: 'center' });
          let kind = 'below the gap: no absorption', k1 = 0;
          const direct = b.valleys.find((q) => q.k0 === 0);
          if (min.k0 === 0) {
            if (E >= gap) { k1 = Math.sqrt((E - gap) / (direct.c + VB_HEAVY)); if (k1 <= 1) { sB.arrow(k1, -VB_HEAVY * k1 * k1, k1, cbE(direct, k1), { color: 'gold', width: 2.6 }); sB.dot(k1, cbE(direct, k1), { r: 5, color: 'gold' }); kind = 'direct, vertical (no phonon needed)'; } else kind = 'beyond the plotted zone'; }
          } else {
            const Ep = b.Ep, edge = b.Ei - Ep;
            if (E >= edge) {
              const event=indirectA(b,E),Ef=event.Ef,kf=event.kf;
              sB.arrow(0,0,0,E,{color:'gold',width:2.6});
              if(kf!==null){sB.arrow(0,E,kf,Ef,{color:'red',width:2.2});sB.dot(kf,Ef,{color:'gold',r:5});}
              kind=`indirect: photon + phonon ${event.emission?'emission':'absorption'}; final energy ${Ef.toFixed(3)}eV${kf===null?' (outside drawn branch)':''}`;
            }
            if (E >= direct.E0) { const kd = Math.sqrt((E - direct.E0) / (direct.c + VB_HEAVY)); if (kd <= 1) { sB.arrow(kd, -VB_HEAVY * kd * kd, kd, cbE(direct, kd), { color: 'gold', width: 1.6, alpha: 0.7 }); kind = 'indirect edge passed; now direct transitions at Γ also allowed'; } }
          }
          // absorption panel
          for (const key of Object.keys(BANDS)) sA.fn((x) => Math.max(1e-3, alphaModel(BANDS[key], x)), { color: key === mat.value ? 'accent' : 'faint', width: key === mat.value ? 3 : 1.4, alpha: key === mat.value ? 1 : 0.8, domain: [0.3, 4] });
          sA.text('floor: 0.3 cm⁻¹',.36,.6,{size:10,color:'muted'});sA.vline(b.Ei || b.Ed, { color: 'orange', width: 1, dash: [4, 4] });
          sA.text('GaAs', 1.5, 3e4, { size: 11, color: 'muted' }); sA.text('Si', 2.6, 4e3, { size: 11, color: 'muted' }); sA.text('Ge', 0.55, 3e4, { size: 11, color: 'muted' });
          hA.set(E, Math.max(.3, alphaModel(b, E)));
          info = {kind,a:alphaModel(b,E),b,E,event:indirectA(b,E)};
        });
        v.readout(() => {
          const b = info.b, E = hw.value; if (!b) return '';
          const kph=(2*PI*E)/1239.8419843320026,kz=(mat.value==='Ge'?Math.sqrt(3)*PI:2*PI)/b.a,need=(b.k0??0)*kz;
          return `$\\hbar\\omega=${v.fix(E, 2)}$ eV ($\\lambda=${v.fix(1239.8419843320026 / E, 0)}$ nm) · ${info.kind} · $\\alpha\\approx${info.a === 0 ? '0' : v.sci(info.a, 2)}\\ \\text{cm}^{-1}$ (absorption depth $1/\\alpha\\approx${info.a === 0 ? '\\infty' : v.fix(1e4 / info.a, info.a > 1e3 ? 2 : 1)}\\ \\mu\\text{m}$)\nThe photon brings $k=${v.sci(kph, 2)}\\ \\text{nm}^{-1}$, only $${v.fix((100 * kph) / kz, 3)}\\%$ of the zone-path scale $k_{edge}$${b.k0 ? ` — the electron needs $\\Delta k\\approx${v.fix(need, 1)}\\ \\text{nm}^{-1}$, $${v.fix(need / kph, 0)}\\times$ more, so a phonon supplies the leading momentum difference in this model` : ' — negligible, so the transition is vertical'}.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Intrinsic carrier density',
      credit: 'Equilibrium parabolic-band carrier model',
      statement: String.raw`In a pure semiconductor in equilibrium the electron and hole densities are equal, $n=p=n_i$, with
$$n_i=\sqrt{N_cN_v}\,e^{-E_g/2k_BT},$$
$$N_{c,v}=2\left(\frac{m_{e,h}^*k_BT}{2\pi\hbar^2}\right)^{3/2},$$
where $N_c,N_v$ are the effective densities of states at the band edges and $m^*_{e,h}$ the density-of-states effective masses. The chemical potential sits near mid-gap, $\mu=\tfrac12E_g+\tfrac34k_BT\ln(m_h^*/m_e^*)$. A plot of $\ln n_i$ against $1/T$ is therefore nearly a straight line of slope $-E_g/2k_B$ (the $T^{3/2}$ prefactor and the temperature dependence of $E_g$ bend it slightly). This holds when $E_g\gg k_BT$, so that the Fermi function is a Boltzmann factor.`,
      idea: String.raw`The density of conduction electrons is the integral of (density of states $\propto\sqrt{E-E_c}$) times (Fermi function, from thermo-8.4). When the chemical potential lies far below $E_c$ the Fermi function is $e^{-(E-\mu)/k_BT}$ and the integral is $N_ce^{-(E_c-\mu)/k_BT}$; the same for holes with $N_v$ and $(\mu-E_v)$. Requiring $n=p$ fixes $\mu$, and in the product $np=N_cN_ve^{-E_g/k_BT}$ the chemical potential cancels, so $n_i$ depends only on the gap and the masses. Creating one electron–hole pair costs approximately $E_g$. Solving the equal-density condition gives an $E_g/2$ activation exponent for each carrier density; it does not mean that a single promotion across the gap costs half a gap (cm-2.4).

The prefactor also uses a definite integral, not only cancellation of chemical potentials. With $T>0$ and a positive density-of-states mass, the three-dimensional parabolic DOS requires $\int_0^\infty\sqrt{\epsilon}\,e^{-\epsilon/k_BT}\,d\epsilon$. The Gaussian and half-integer Gamma identities (pma 8.21) evaluate it as $\tfrac{\sqrt\pi}{2}(k_BT)^{3/2}$. Combining this with the spin-two, per-volume DOS normalization gives exactly the displayed $N_c$ or $N_v$. The replacement of the Fermi function by that exponential still requires the stated nondegenerate band-edge regime.`,
      caption: String.raw`Drag temperature on the Arrhenius plot. Right: occupied conduction states and empty valence states, each normalized to its own peak for visibility. The numerical Fermi–Dirac and Boltzmann calculations use the **same selected gap**, including when gap shrinkage is switched off. Read the local slope: its apparent activation gap is $E_g-T\,dE_g/dT+3k_BT$, so even a constant gap does not give a perfectly straight line because of the $T^{3/2}$ prefactor. These are parabolic-band calculations, not measured carrier-density curves.`,
      scope: String.raw`Equilibrium undoped 3D parabolic bands. Densities of states at 300 K follow Hu's Table 1–4: $(N_c,N_v)$ are $(2.8\times10^{19},1.04\times10^{19})$ for Si, $(1.04\times10^{19},6.0\times10^{18})$ for Ge and $(4.7\times10^{17},7.0\times10^{18})$ for GaAs, in cm$^{-3}$, with assumed $T^{3/2}$ scaling. Gap parameterizations follow the Ioffe temperature-dependence summaries. They are a particular approximate parameter set, not a claim of universal few-percent accuracy or reconstruction of measured $n_i$. The Fermi–Dirac integral is evaluated numerically; the Boltzmann limit requires the chemical potential well inside the gap.`,
      deps: ['cm-4.1', 'thermo-8.4', 'cm-2.4', 'pma-8.21'],
      refs: ['Chenming Hu, §§1.7–1.8, Eqs. (1.8.1)–(1.8.15), Table 1–4 and footnote 3', 'Ioffe NSM Archive, Si/Ge/GaAs band structure, Temperature Dependences'],
      tags: ['intrinsic', 'carrier density', 'arrhenius'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carrier_generation_and_recombination' },
      verify: false,
      viz(v) {
        const mat = v.select('material', [{ value: 'Ge', label: 'Ge' }, { value: 'Si', label: 'Si' }, { value: 'GaAs', label: 'GaAs' }], 'Si');
        const shrink = v.toggle('gap shrinks with $T$ (Varshni)', true);
        const COL = { Ge: 'orange', Si: 'accent', GaAs: 'purple' };
        const EgT = (m, T) => (shrink.value ? gapA(m, T) : gapA(m, 300));
        const niT = (m, T) => Math.sqrt(densityC(m, T) * densityV(m, T)) * Math.exp(-EgT(m, T) / (2 * KB * T));
        const sA = v.stage({ x: [1, 10], y: [1e-2, 1e18], ylog: true, axes: 'box', gutter: true, height: 360, xlabel: '$1000/T$ (K$^{-1}$)', ylabel: '$n_i$ (cm$^{-3}$)', title: 'Arrhenius plot of the intrinsic density', weight: 1.1 });
        const sB = v.stage({ x: [-1.15, 1.15], y: [-0.7, 1.8], axes: 'box', gutter: true, height: 360, xlabel: 'occupied states (holes ← | → electrons), scaled', ylabel: 'energy $E$ (eV)', xticks: [], title: 'where the carriers sit', weight: 0.9 });
        const h = sA.handle(3.33, 1e10, { color: 'gold', r: 7, constrain: (x) => { const xx = Math.max(1, Math.min(10, x)); return [xx,niT(MATERIALS[mat.value],1000/xx)]; } });
        v.legend([['orange', 'Ge'], ['accent', 'Si'], ['purple', 'GaAs'], ['gold', 'chosen $T$']]);
        let info = {};
        v.render(() => {
          for (const k of ['Ge', 'Si', 'GaAs']) sA.fn((x) => niT(MATERIALS[k],1000/x), { color: COL[k], width: k === mat.value ? 3 : 1.5, alpha: k === mat.value ? 1 : 0.5, domain: [1, 10] });
          const m = MATERIALS[mat.value], T = 1000 / h.x, E = EgT(m, T), kT = KB * T; h.set(h.x,niT(m,T)); const ymin=Math.min(...Object.values(MATERIALS).map(z=>niT(z,100)))*.5;sA.setView([1,10],[ymin,1e20]);
          const sol = neutralityA(m,T,0,0,0,E); // intrinsic: numerical Fermi–Dirac
          const mu = sol.mu;
          // right panel: energy axis with Ev = 0
          sB.rect(-1.15, E, 1.15, 1.8, { fill: 'accent', fillAlpha: 0.08, stroke: false }); sB.rect(-1.15, -0.7, 1.15, 0, { fill: 'green', fillAlpha: 0.08, stroke: false });
          sB.hline(E, { color: 'accent', width: 1.6 }); sB.hline(0, { color: 'green', width: 1.6 });
          sB.text('$E_c$', 1.0, E + 0.07, { size: 11, color: 'accent' }); sB.text('$E_v$', 1.0, -0.1, { size: 11, color: 'green' });
          sB.hline(mu, { color: 'gold', width: 1.4, dash: [5, 4] }); sB.text('$\\mu$', -1.08, mu + 0.06, { size: 11, color: 'gold' });
          const fe=x=>fermiA((x-mu)/kT),fh=x=>fermiA((mu-x)/kT);
          let maxN = 0, maxP = 0;
          for (let i = 0; i <= 300; i++) { const x = E + (1.8 - E) * (i / 300); maxN = Math.max(maxN, Math.sqrt(x - E) * fe(x)); }
          for (let i = 0; i <= 300; i++) { const x = -0.7 * (i / 300); maxP = Math.max(maxP, Math.sqrt(-x) * fh(x)); }
          const scN = maxN > 0 ? 1 / maxN : 1, scP = maxP > 0 ? 1 / maxP : 1;
          sB.path(Array.from({ length: 150 }, (_, i) => { const x = E + (1.8 - E) * (i / 149); return [0.95 * scN * Math.sqrt(x - E) * fe(x), x]; }), { color: 'accent', width: 2.2 });
          sB.path(Array.from({ length: 150 }, (_, i) => { const x = -0.7 * (i / 149); return [-0.95 * scP * Math.sqrt(-x) * fh(x), x]; }), { color: 'green', width: 2.2 });
          // Fermi function (small, in the gap) for orientation
          sB.path(Array.from({ length: 80 }, (_, i) => { const x = -0.7 + 2.5 * (i / 79); return [-0.05 + 0.1 * fe(x), x]; }), { color: 'muted', width: 1.2, alpha: 0.7 });
          sB.text('Fermi function $f(E)$', 0.06, 0.4 * E, { size: 10, color: 'muted' });
          // true magnification: the plotted peak corresponds to n/(Nc·integral) etc.
          const nExact = sol.n, nB = Math.sqrt(densityC(m, T) * densityV(m, T)) * Math.exp(-E / (2 * kT));
          // apparent gap from the local slope (dlnni / d(1/T))
          const dT = 1e-3, x1 = h.x * (1 - dT), x2 = h.x * (1 + dT);
          const sl = (Math.log(niT(m, 1000 / x2)) - Math.log(niT(m, 1000 / x1))) / ((x2 - x1) / 1000);
          info = { T, E, mu, nExact, nB, app: -2 * KB * sl, m };
        });
        v.readout(() => {
          const I = info; if (!I.m) return '';

          return `$T=${v.fix(I.T, 0)}$ K · $E_g=${v.fix(I.E, 3)}$ eV · $n_i=${v.sci(I.nB, 2)}\\ \\text{cm}^{-3}$ (Boltzmann) vs $${v.sci(I.nExact, 2)}$ (numerical Fermi–Dirac, $${v.fix((100 * (I.nB - I.nExact)) / I.nExact, 2)}\\%$ apart) · $\\mu-E_v=${v.fix(I.mu, 3)}$ eV ($E_g/2=${v.fix(I.E / 2, 3)}$)\nApparent gap from the slope of the Arrhenius line: $-2k_B\\,d\\ln n_i/d(1/T)=${v.fix(I.app, 3)}$ eV (true $E_g=${v.fix(I.E, 3)}$ eV; correction $3k_BT-T\\,dE_g/dT$ from the prefactor and changing gap) · model 300 K value $${v.sci(niT(I.m,300),2)}$ cm$^{-3}$.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Law',
      name: 'Law of mass action: np = n_i²',
      credit: 'Shockley, 1949–50',
      statement: String.raw`In thermal equilibrium, for a non-degenerate semiconductor with any doping, the product of the electron and hole densities is a constant that depends only on the temperature and the material:
$$np=n_i^{2}(T)=N_cN_ve^{-E_g/k_BT}.$$
Combined with charge neutrality $n+N_a=p+N_d$ for fully ionized donors $N_d$ and acceptors $N_a$ this gives
$$n=\tfrac12\bigl[(N_d-N_a)+\sqrt{(N_d-N_a)^2+4n_i^2}\bigr],\qquad p=n_i^2/n.$$
Away from equilibrium (light, injection) $np>n_i^2$: the splitting of the quasi-Fermi levels satisfies $np=n_i^2e^{(F_n-F_p)/k_BT}$.`,
      idea: String.raw`The proof is the cancellation already seen in cm-4.2: $n=N_ce^{-(E_c-\mu)/k_BT}$ and $p=N_ve^{-(\mu-E_v)/k_BT}$ both contain the same chemical potential, with opposite signs, so $\mu$ drops out of the product whatever the doping. Physically, doping moves $\mu$ and trades one carrier type for the other, a bit like $[\text{H}^+][\text{OH}^-]=K_w$ in water, because thermal generation and recombination of pairs balance at the same rate $\propto np$. Substituting $p=n_i^2/n$ in the neutrality condition gives a quadratic for $n$.`,
      caption: String.raw`Choose a material and temperature and slide the **donor** and **acceptor** densities (log scales). **Left:** $n$ and $p$ against $N_d$ at the chosen $N_a$: above $n_i$ the majority density follows the net doping, and the minority density drops exactly as $n_i^2/N$. **Right:** the same state in the $(\log n,\log p)$ plane: every equilibrium state sits on the straight line $\log n+\log p=2\log n_i$ (the dashed line is the same law at 300 K). Switch on **illumination** and add excess carriers $\Delta n=\Delta p$: the point leaves the line, $np>n_i^2$, and the readout shows the quasi-Fermi splitting. Raise $T$ and the whole line moves out.`,
      scope: String.raw`Equilibrium, non-degenerate ($\mu$ more than a few $k_BT$ from either band edge; fails above about $10^{19}$ cm$^{-3}$ doping in Si), complete ionization of dopants. The intrinsic density is computed from the model of cm-4.2 (Boltzmann, Varshni gap).`,
      deps: ['cm-4.2'],
      refs: ['Ashcroft–Mermin ch. 28', 'Kittel ch. 8'],
      tags: ['mass action', 'doping', 'carriers'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Law_of_mass_action' },
      viz(v) {
        const mat = v.select('material', [{ value: 'Ge', label: 'Ge' }, { value: 'Si', label: 'Si' }, { value: 'GaAs', label: 'GaAs' }], 'Si');
        const Ts = v.slider('temperature $T$ (K)', 200, 700, 300, { step: 5 });
        const Nds = v.slider('donors $N_d$ (cm$^{-3}$)', 1e8, 1e19, 1e16, { log: true, fmt: dens(v.M) });
        const Nas = v.slider('acceptors $N_a$ (cm$^{-3}$)', 1e8, 1e19, 1e8, { log: true, fmt: dens(v.M) });
        const ill = v.toggle('illuminate (excess pairs)', false);
        const dn = v.slider('excess $\\Delta n=\\Delta p$ (cm$^{-3}$)', 1e8, 1e17, 1e13, { log: true, fmt: dens(v.M) });
        const sA = v.stage({ x: [1e8, 1e19], y: [1e0, 1e20], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'donor density $N_d$ (cm$^{-3}$)', ylabel: 'carrier density (cm$^{-3}$)', title: 'electrons and holes against doping', weight: 1.1 });
        const sB = v.stage({ x: [0, 20], y: [0, 20], equal: true, axes: 'box', gutter: true, height: 340, xlabel: '$\\log_{10}n$', ylabel: '$\\log_{10}p$', title: '$np=n_i^2$: the equilibrium line', weight: 0.9 });
        v.legend([['accent', 'electrons $n$'], ['red', 'holes $p$'], ['faint', '$n_i$ (dashed)', { dash: true }], ['gold', 'now']]);
        const neq = (N, ni) => 0.5 * (N + Math.sqrt(N * N + 4 * ni * ni));
        let st = {};
        v.render(() => {
          const m = MAT[mat.value], T = Ts.value, ni = niB(m, T), Nd = Nds.value, Na = Nas.value;
          const f = (x) => neq(x - Na, ni);
          sA.fn((x) => Math.max(1, f(x)), { color: 'accent', width: 2.6, domain: [1e8, 1e19] });
          sA.fn((x) => Math.max(1, ni * ni / f(x)), { color: 'red', width: 2.6, domain: [1e8, 1e19] });
          sA.hline(ni, { color: 'muted', width: 1.2, dash: [5, 4] }); sA.text('$n_i$', 1.4e8, ni * 2.2, { size: 11, color: 'muted' });
          sA.vline(Nd, { color: 'gold', width: 1.4 });
          const n0 = neq(Nd - Na, ni), p0 = ni * ni / n0;
          let n = n0, p = p0, fs = 0;
          if (ill.value) { const D = dn.value; n = n0 + D; p = p0 + D; fs = KB * T * Math.log((n * p) / (ni * ni)); }
          sA.dot(Nd, Math.max(1, n), { r: 6, color: 'gold' }); sA.dot(Nd, Math.max(1, p), { r: 6, color: 'gold', hollow: true });
          const ln = Math.log10(ni), L = Math.log10;
          sB.line(0, 2 * ln, 2 * ln, 0, { color: 'accent', width: 2.4 });
          const n300 = niB(m, 300); if (Math.abs(L(n300) - ln) > 0.01) sB.line(0, 2 * L(n300), 2 * L(n300), 0, { color: 'faint', width: 1.4, dash: [5, 4] });
          sB.path([[L(n0), L(p0)]], { color: 'gold' });
          sB.dot(L(Math.max(1, n)), L(Math.max(1, p)), { r: 7, color: 'gold', label: ill.value ? 'illuminated' : 'equilibrium', labelPos: 'ne' });
          if (ill.value) { sB.dot(L(n0), L(p0), { r: 4, color: 'muted' }); sB.arrow(L(n0), L(p0), L(n), L(p), { color: 'orange', width: 1.4 }); }
          sB.text('$np=n_i^2$', 2 * ln * 0.25, 2 * ln * 0.75, { size: 11, color: 'accent', dx: 12, dy: -8 });
          st = { n, p, ni, n0, p0, fs, T, type: Nd > Na ? 'n-type' : 'p-type' };
        });
        v.readout(() => {
          const S = st; if (!S.ni) return '';
          const prod = S.n * S.p / (S.ni * S.ni);
          return `$n_i=${v.sci(S.ni, 2)}$ · $n=${v.sci(S.n, 2)}$, $p=${v.sci(S.p, 2)}$ (${S.type}) · $np/n_i^2=${ill.value ? v.sci(prod, 2) : v.fix(prod, 4)}$${ill.value ? ` — out of equilibrium: $F_n-F_p=k_BT\\ln(np/n_i^2)=${v.fix(1000 * S.fs, 0)}$ meV` : ' — pinned to 1 at every doping'}\nDoping changes the majority density by factors of up to $10^{${v.fix(Math.log10(Math.max(S.n, S.p) / S.ni), 1)}}$ above intrinsic and the minority by the same factor below.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Model',
      name: 'Donors and acceptors as hydrogenic impurities',
      credit: 'Isotropic effective-mass donor model',
      statement: String.raw`A donor atom in a semiconductor (phosphorus on a silicon site) contributes one extra electron that moves in the Coulomb field of the donor ion, screened by the dielectric constant $\varepsilon$ of the crystal and carrying the band effective mass $m^*$. Its bound states are those of hydrogen with $e^2\to e^2/\varepsilon$ and $m\to m^*$:
$$E_n=-\frac{m^*}{m_0}\frac{1}{\varepsilon^2}\frac{13.6\ \text{eV}}{n^2},\qquad a^*=\varepsilon\,\frac{m_0}{m^*}\,a_0 .$$
For suitable masses and dielectric constants the binding is of order meV to tens of meV and the envelope spans many lattice constants. A single isotropic hole mass gives an analogous acceptor model, but real multiband acceptors need further corrections.`,
      idea: String.raw`The electron's wave function is a slowly varying envelope multiplied by a Bloch function of the conduction-band edge (Bloch's theorem, qm-9.7, and the effective-mass idea cm-2.3 combined). The envelope obeys the Schrödinger equation of a particle of mass $m^*$ in the potential $-e^2/(4\pi\varepsilon_0\varepsilon r)$, i.e. the hydrogen problem (qm-8.12) with rescaled constants. The scaling is self-consistent: with $\varepsilon\sim12$ and $m^*\sim0.1\,m_0$ the Bohr radius becomes about $6$ nm, roughly ten lattice spacings, so averaging the crystal's response into $\varepsilon$ and $m^*$ is justified. Thermal ionization also depends on dopant density and the chemical potential; $E_d/k_BT$ alone does not determine the ionized fraction (see cm-4.5).`,
      caption: String.raw`Choose a rounded host-inspired preset or vary mass and dielectric constant. Left: a planar slice of the ground-state envelope probability density $|\psi|^2\propto e^{-2r/a^*}$; the circle marks the Bohr length, not a classical orbit or a sharp cloud boundary. Whole-cloud and lattice zooms show the envelope and host spacing. Right: hydrogenic levels and thermal-energy scale. Custom values with $a^*$ comparable to the lattice spacing explicitly fail the slowly varying-envelope assumption.`,
      scope: String.raw`Isotropic shallow-impurity envelope, valid when $a^*\gg a$. Preset conductivity masses are 0.26 (Si), 0.12 (Ge) and 0.068 (GaAs), with dielectric constants 12, 16.2 and 12.9; they are host-inspired scalar approximations, not a precision anisotropic donor model. Short-range central-cell chemistry, valley coupling and multiband holes are omitted. No measured donor binding energy is inferred from this isotropic model.`,
      deps: ['cm-4.1', 'cm-2.3', 'qm-8.12'],
      refs: ['Chenming Hu, §1.2, Eq. (1.2.1), §1.5/Table 1–3; conductivity versus density-of-states mass footnote 3', 'Ioffe NSM Archive, Si/Ge/GaAs basic parameters and effective masses; CODATA2022 hydrogen scales'],
      tags: ['donors', 'effective mass', 'hydrogenic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Doping_(semiconductor)' },
      verify: false,
      viz(v) {
        const HOST = { Si: {m:.26,eps:12,a:.543}, Ge: {m:.12,eps:16.2,a:.5658}, GaAs: {m:.068,eps:12.9,a:.565325} };
        const host = v.select('host crystal', [{ value: 'Si', label: 'Si' }, { value: 'Ge', label: 'Ge' }, { value: 'GaAs', label: 'GaAs' }], 'Si');
        const mS = v.slider('effective mass $m^*/m_0$', 0.03, 1.2, 0.26, { log: true, sig: 2 });
        const eS = v.slider('dielectric constant $\\varepsilon$', 4,40,12, { step: 0.1 });
        const zoom = v.select('zoom', [{ value: 'orbit', label: 'whole cloud' }, { value: 'lattice', label: 'a few lattice sites' }], 'orbit');
        const TS = v.slider('temperature $T$ (K)', 4, 400, 100, { log: true, sig: 2 });
        const apply = () => { const H = HOST[host.value]; mS.set(H.m); eS.set(H.eps); };
        let last = host.value;
        const sA = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: false, height: 360, title: 'ground-state envelope slice on lattice (nm)', weight: 1.1 });
        const sB = v.stage({ x: [0, 1], y: [-0.06, 0.012], axes: 'box', gutter: true, height: 360, xlabel: '', ylabel: 'energy $E-E_c$ (eV)', xticks: [], title: 'hydrogen-like ladder', weight: 0.8 });
        let info = {};
        v.render(() => {
          if (host.value !== last) { last = host.value; apply(); }
          const H=HOST[host.value],m=mS.value,e=eS.value,T=TS.value,I=impurityA(m,e,H.a,T),{Ed,aB,kT}=I; const ladderDepth=Math.max(1.18*Ed,1.4*kT,.012); sB.setView([0,1],[-ladderDepth,.24*ladderDepth]);
          const R = zoom.value === 'orbit' ? 1.9 * aB : 1.0;
          sA.setView([-R, R], [-R, R]);
          sA.raster((x, y) => { const r = Math.hypot(x, y) / aB, a = 0.75 * Math.exp(-2 * r) * (1 + 0.0); return a < 0.01 ? null : [...v.rgb('accent').slice(0, 3), a]; }, { res: 3, key: `${aB.toFixed(3)}${R.toFixed(2)}` });
          drawLattice(sA, v, H.a, R);
          sA.circle(0, 0, aB, { color: 'accent', width: 2.2, stroke: true, fill: false });
          sA.dot(0, 0, { r: 6, color: 'red' });
          sA.tex('\\text{donor ion }(+)', 0.0, 0.0, { dy: 16, size: 11, color: 'red', baseline: 'top' });
          if (R > aB * 0.9) { sA.measure(0, -aB * 0.55, aB, -aB * 0.55, `a* = ${v.fix(aB, 2)} nm`); }
          sA.measure(-R * 0.9, R * 0.85, -R * 0.9 + H.a, R * 0.85, `a = ${H.a.toFixed(3)} nm`);
          // right: ladder
          sB.hline(0, { color: 'accent', width: 2.4 }); sB.text('conduction band edge $E_c$', 0.98, .16*ladderDepth, { size: 10, color: 'accent', align: 'right' });
          for (let n = 1; n <= 5; n++) { const En = -Ed / (n * n); sB.line(0.12, En, 0.5, En, { color: n === 1 ? 'orange' : 'muted', width: n === 1 ? 2.8 : 1.6 }); if (n <= 2) sB.text(`n = ${n}: ${v.fix(1000 * -En, 1)} meV`, 0.52, En, { size: 10, color: n === 1 ? 'orange' : 'muted', baseline: 'middle' }); }
          sB.text('n = 3, 4, … crowd up to the band edge', 0.12, .065*ladderDepth, { size: 10, color: 'muted' });
          sB.rect(0.8, -kT, 0.92, 0, { fill: 'gold', fillAlpha: 0.35, color: 'gold' }); sB.text('thermal energy $k_BT$', 0.86, -kT - 0.0015, { size: 10, color: 'gold', align: 'center', baseline: 'top' });
          sB.arrow(0.3, -Ed, 0.3, 0, { color: 'green', width: 1.8 }); sB.text('ionize', 0.08, -Ed / 2, { size: 10, color: 'green' });
          const nat = (4 / 3) * PI * aB ** 3 * (8 / H.a ** 3);
          info = { H, m, e, Ed, aB, nat, kT };
        });
        v.readout(() => {
          const I = info; if (!I.H) return '';
          return `$E_d=${v.fix(1000*I.Ed,2)}$ meV · Bohr length $a^*=${v.fix(I.aB,3)}$ nm $=${v.fix(I.aB/I.H.a,2)}$ lattice constants · about $${v.fix(I.nat,0)}$ host atoms inside radius $a^*$ · $E_d/k_BT=${v.fix(I.Ed/I.kT,2)}$\n${I.aB/I.H.a<5?'Envelope approximation fails: the chosen Bohr length is not large compared with lattice spacing.':'Scalar envelope model; central-cell and anisotropic corrections not included.'} The circle is a length scale; only $1-5e^{-2}\\approx32.3\\%$ of a hydrogenic 1s probability lies inside that radius.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Definition',
      name: 'Chemical potential versus doping and temperature',
      statement: String.raw`The **chemical potential** $\mu$ (the Fermi level) of a doped semiconductor is fixed by charge neutrality,
$$\begin{gathered}n(\mu)+N_a^-=p(\mu)+N_d^+(\mu),\\ N_d^+=\frac{N_d}{1+2\,e^{(\mu-E_d')/k_BT}},\end{gathered}$$
with $E_d'=E_c-E_d$ the donor level and a spin factor $2$ in the occupation. With negligible compensation and moderate doping, as $T$ rises an $n$-type sample passes through three regimes: **freeze-out** at low $T$ (few donors ionized, $\mu$ between the donor level and $E_c$, $n\propto e^{-E_d/2k_BT}$), the **extrinsic plateau** (all donors ionized, $n\simeq N_d$, $\mu$ falling slowly below $E_c$) and the **intrinsic regime** (thermally generated pairs exceed the doping, $n\approx p\approx n_i$, $\mu$ approaches the intrinsic level (near mid-gap)).`,
      idea: String.raw`Each carrier density is a function of $\mu$ alone (cm-4.2, with numerically evaluated Fermi–Dirac integrals); the donor occupation is a Fermi function with a degeneracy factor because a donor level can hold one electron of either spin but not two. The neutrality condition is then one equation in one unknown $\mu$, monotone in $\mu$, so a bisection finds it for every $T$. Freeze-out ends when $k_BT\sim E_d/\ln(N_c/N_d)$; the intrinsic regime begins when $n_i(T)\sim N_d$, which is why heavily doped samples stay extrinsic to higher temperature and wide-gap materials make devices that work hot. At fixed positive temperature, write the charge imbalance as $F(\mu)=n(\mu)+N_a-p(\mu)-N_d^+(\mu)$. The Fermi occupations make $n$ strictly increase with $\mu$, while $p$ and the ionized-donor density decrease. The derivative-sign theorem and its mean-value proof (pma 5.11) therefore give strict monotonicity. Continuity and opposite signs at a bracket allow the intermediate value theorem (pma 4.23) to supply a root; strict monotonicity makes it unique and justifies bisection. A numerical search must still obtain such a bracket.`,
      caption: String.raw`Drag the temperature handle over 30–1000 K. The curves show the band edges, donor level and charge-neutral chemical potential. Right: electron and hole densities, net fully ionized dopant reference where positive, and the Boltzmann intrinsic estimate. Compensating acceptors can produce a hole-dominated sample; that is labeled separately rather than misidentified as intrinsic. All plotted positive densities retain their actual model values.`,
      scope: String.raw`One donor level with spin degeneracy 2, fully ionized acceptors and non-interacting impurities; no impurity band or gap narrowing. Binding inputs are rounded model values 45 meV (Si), 13 meV (Ge), 6 meV (GaAs), following Hu's silicon example and Ioffe donor summaries. The donor-only freeze-out asymptote assumes negligible compensation and nondegenerate bands; it is not universal for all slider settings. 30 K minimum avoids numerical underflow in the heavily compensated wide-gap case. Heavy doping and low-temperature acceptor ionization require more complete physics than this model.`,
      deps: ['cm-4.3', 'cm-4.4', 'pma-4.23', 'pma-5.11'],
      refs: ['Chenming Hu, §§1.8–1.10, Fig. 1–23, Eqs. (1.9.1), (1.10.2); Ioffe donor and gap summaries'],
      tags: ['fermi level', 'freeze-out', 'doping'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fermi_level#Semiconductors' },
      verify: false,
      viz(v) {
        const mat = v.select('material', [{ value: 'Si', label: 'Si' }, { value: 'Ge', label: 'Ge' }, { value: 'GaAs', label: 'GaAs' }], 'Si');
        const Nds = v.slider('donors $N_d$ (cm$^{-3}$)', 1e12, 1e19, 1e15, { log: true, fmt: dens(v.M) });
        const Nas = v.slider('acceptors $N_a$ (cm$^{-3}$)', 1e0, 1e18, 1, { log: true, fmt: dens(v.M) });
        const NT = 90, Ts = Array.from({ length: NT }, (_, i) => 30 * Math.pow(1000/30,i/(NT-1))); // 30 … 1000 K
        let key = '', curve = [];
        const sM = v.stage({ x: [30,1000], y: [-0.1, 1.6], xlog: true, axes: 'box', gutter: true, height: 360, xlabel: 'temperature $T$ (K)', ylabel: 'energy above $E_v$ (eV)', title: 'chemical potential $\\mu(T)$', weight: 1 });
        const sN = v.stage({ x: [30,1000], y: [1e0, 1e20], xlog: true, ylog: true, axes: 'box', gutter: true, height: 360, xlabel: 'temperature $T$ (K)', ylabel: 'carrier density (cm$^{-3}$)', title: 'electron and hole densities', weight: 1 });
        const h = sM.handle(100, 1.0, { color: 'gold', r: 7, constrain: (x) => { const T = Math.max(30,Math.min(1000,x)); const c = neutralityA(MATERIALS[mat.value], T, Nds.value, Nas.value); return [T, c.mu]; } });
        v.legend([['accent', '$E_c$ / electrons'], ['green', '$E_v$ / holes'], ['orange', 'donor level', { dash: true }], ['gold', '$\\mu$']]);
        let info = {};
        v.render(() => {
          const m = MATERIALS[mat.value], k = `${mat.value}|${Nds.value}|${Nas.value}`;
          if (k !== key) { key = k; curve = Ts.map((T) => ({ T, ...neutralityA(m, T, Nds.value, Nas.value), E: gapA(m, T), ni: intrinsicA(m, T) })); }
          sM.setView([30,1000],[Math.min(-.1,...curve.map(q=>q.mu))-.05,Math.max(...curve.map(q=>q.E),...curve.map(q=>q.mu))+.1]);sN.setView([30,1000],[Math.min(...curve.flatMap(q=>[q.n,q.p,q.ni]))*.5,Math.max(Nds.value,Nas.value,...curve.flatMap(q=>[q.n,q.p,q.ni]))*2]);
          sM.path(curve.map((q) => [q.T, q.E]), { color: 'accent', width: 2 });
          sM.hline(0, { color: 'green', width: 2 });
          sM.path(curve.map((q) => [q.T, q.E - m.Ed]), { color: 'orange', width: 1.4, dash: [4, 4] });
          sM.path(curve.map((q) => [q.T, q.E / 2]), { color: 'faint', width: 1, dash: [2, 4] });
          sM.path(curve.map((q) => [q.T, q.mu]), { color: 'gold', width: 3 });
          const T = h.x, c = neutralityA(m, T, Nds.value, Nas.value); h.set(T, c.mu);
          sN.path(curve.map((q) => [q.T, q.n]), { color: 'accent', width: 2.8 });
          if(Nds.value>Nas.value)sN.hline(Nds.value-Nas.value, { color: 'muted', width: 1.2, dash: [5, 4] }); sN.path(curve.map((q) => [q.T, q.ni]), { color: 'red', width: 1.6, dash: [2, 4] });
          if(Nds.value>Nas.value)sN.text('$N_d-N_a$',35,(Nds.value-Nas.value)*1.25,{size:10,color:'muted'});sN.path(curve.map(q=>[q.T,q.p]),{color:'green',width:1.6}); sN.text('$n_i(T)$', 420, 1e16, { size: 11, color: 'red' });
          sN.vline(T, { color: 'gold', width: 1.2 }); sN.dot(T, c.n, { r: 6, color: 'gold' });
          const E = gapA(m, T), frac = Nds.value > 0 ? c.ndp / Nds.value : 1;
          const reg=dopingRegime(c,Nds.value,Nas.value);
          info = { T, E, mu: c.mu, n: c.n, p: c.p, frac, reg, Ec: E, m };
        });
        v.readout(() => {
          const I = info; if (!I.m) return '';
          return `$T=${v.fix(I.T, 0)}$ K · **${I.reg}** · $\\mu-E_v=${v.fix(I.mu, 3)}$ eV ($E_c-\\mu=${v.fix(1000 * (I.E - I.mu), 0)}$ meV, $k_BT=${v.fix(1000 * KB * I.T, 1)}$ meV)\n$n=${v.sci(I.n, 2)}$, $p=${v.sci(I.p, 2)}\\ \\text{cm}^{-3}$ · fraction of donors ionized $N_d^+/N_d=${v.fix(I.frac, 3)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Model',
      name: 'Drift, diffusion and the Einstein relation',
      credit: 'Einstein, 1905 (relation); Shockley, 1950 (drift–diffusion for semiconductors)',
      statement: String.raw`Charge carriers carry a current by **drift** in an electric field, $J_{\text{drift}}=e\,n\,\mu\,E$, and by **diffusion** down a density gradient (Fick's law, thermo-7.6), $J_{\text{diff}}=eD\,\nabla n$ for electrons (sign reversed for the electron-charge convention),
$$J_n=e\,n\,\mu_n E+eD_n\nabla n .$$
In thermal equilibrium the total current vanishes, which forces the **Einstein relation** between the two transport coefficients,
$$\frac{D}{\mu}=\frac{k_BT}{e},$$
and gives the Boltzmann profile $n\propto e^{-e\phi/k_BT}$ in a potential $\phi$. At room temperature $k_BT/e\approx25.9$ mV. The relation is a statement of fluctuation–dissipation; for a degenerate gas $k_BT$ is replaced by a larger quantity.`,
      idea: String.raw`In a Drude picture (em-6.4) a carrier accelerates for a time $\tau$ between collisions, so its drift velocity is $\mu E$ with $\mu=e\tau/m^*$, while the random velocity between collisions, with $\langle v_x^2\rangle=k_BT/m^*$ (equipartition), makes a random walk of step $v\tau$, so $D=\langle v_x^2\rangle\tau=k_BT\tau/m^*$. Dividing eliminates the scattering time and the mass: $D/\mu=k_BT/e$. Equivalently, in equilibrium the density follows the Boltzmann factor of the potential energy; a density gradient $\nabla n=-(eE/k_BT)n$ then produces a diffusion current that cancels the drift current only if $D/\mu=k_BT/e$.`,
      caption: String.raw`A **simulation** of $3000$ carriers that accelerate in the field and have their velocity re-drawn from a thermal (Maxwell) distribution at random Poisson times (mean $\tau=1$); nothing in the code mentions the Einstein relation. **Packet mode:** start all carriers at one point; the cloud's centre drifts at $\mu E$ and its variance grows as $2Dt$, from which the readout measures $\mu$ and $D$ (for $t\gg\tau$; at early times the motion is ballistic). **Equilibrium mode:** carriers confined between walls at $x=0$ and $L$, pushed toward $x=0$: they pile up in the steady profile $n\propto e^{-eEx/k_BT}$, whose measured decay length is $k_BT/eE$ only if the Einstein relation holds. Move $T$ and $E$ and watch the measured ratio follow $k_BT/e$; raise $E$ far enough and it fails, because the Einstein relation is a linear-response result (the field heats the carriers).`,
      scope: String.raw`Non-degenerate carriers with a single energy-independent relaxation time (collisions that fully re-thermalize the velocity); in real semiconductors $\mu$ and $D$ both depend on doping and temperature, but their ratio is still $k_BT/e$ in the non-degenerate regime. The Einstein relation is a **linear-response** statement: in a strong field the carriers' mean energy rises and in this model $D/\mu=k_BT/e+(eE\tau)^2\tau/m^*$. Units: $m^*=e=\tau=1$ and the thermal velocity at 300 K equal to 1; $k_BT/e$ at 300 K is $25.85$ mV.`,
      deps: ['cm-4.5', 'em-6.4', 'thermo-7.6'],
      refs: ['Ashcroft–Mermin ch. 29'],
      tags: ['drift', 'diffusion', 'einstein relation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Einstein_relation_(kinetic_theory)' },
      viz(v) {
        const mode = v.select('experiment', [{ value: 'packet', label: 'spreading packet' }, { value: 'box', label: 'equilibrium between walls' }], 'packet');
        const Es = v.slider('field $eE/m$', 0, 1, 0.2, { step: 0.01 });
        const Ts = v.slider('temperature $T$ (K)', 100, 600, 300, { step: 10 });
        const NP = 3000, DT = 0.05, TM = { packet: 14, box: 100 }, LBOX = 10;
        let key = '', S = null;
        function simulate(a, kT, md) {
          const steps = Math.round(TM[md] / DT), R = v.rng(md === 'box' ? 7 : 3), sd = Math.sqrt(kT), pc = 1 - Math.exp(-DT);
          const X = new Float32Array((steps + 1) * NP); const x = new Float64Array(NP), w = new Float64Array(NP);
          for (let i = 0; i < NP; i++) { x[i] = md === 'box' ? R() * LBOX : 0; w[i] = sd * R.normal(); X[i] = x[i]; }
          for (let s = 1; s <= steps; s++) {
            for (let i = 0; i < NP; i++) {
              const f = md === 'box' ? -a : a; // in the box the field pushes toward x = 0
              x[i] += w[i] * DT + 0.5 * f * DT * DT; w[i] += f * DT;
              if (R() < pc) w[i] = sd * R.normal();
              if (md === 'box') { if (x[i] < 0) { x[i] = -x[i]; w[i] = -w[i]; } else if (x[i] > LBOX) { x[i] = 2 * LBOX - x[i]; w[i] = -w[i]; } }
              X[s * NP + i] = x[i];
            }
          }
          return { steps, X, a, kT, md };
        }
        const sT = v.stage({ x: [-4, 18], y: [0, 14], axes: 'box', gutter: true, height: 360, xlabel: 'position $x$', ylabel: 'time $t/\\tau$', title: 'sample trajectories', weight: 1 });
        const sH = v.stage({ x: [-6, 24], y: [0, 0.4], axes: 'box', gutter: true, height: 360, xlabel: 'position $x$', ylabel: 'density', title: 'carrier density at time $t$', weight: 1 });
        v.legend([['accent', 'simulation'], ['orange', 'drift + diffusion prediction'], ['gold', 'cloud centre']]);
        let st = {};
        v.animate((t) => {
          const md = mode.value, a = Es.value, kT = Ts.value / 300, k = `${md}|${a}|${kT}`;
          if (k !== key) { key = k; S = simulate(a, kT, md); }
          const TMx = TM[md], tt = (Math.min(t, 14) / 14) * TMx, si = Math.min(S.steps, Math.round(tt / DT)), ts = si * DT;
          sT.setView(md === 'box' ? [-0.5, LBOX + 0.5] : [-6 - 2 * a, 8 + 14 * (a + 0.2)], [0, TMx]);
          for (let p = 0; p < 12; p++) { const pts = []; for (let s = 0; s <= si; s += md === 'box' ? 4 : 1) pts.push([S.X[s * NP + p], s * DT]); sT.path(pts, { color: 'accent', width: 1.2, alpha: 0.55 }); }
          sT.hline(ts, { color: 'faint', width: 1, dash: [3, 4] });
          const vals = new Array(NP); let sum = 0, sum2 = 0;
          for (let i = 0; i < NP; i++) { const xv = S.X[si * NP + i]; vals[i] = xv; sum += xv; }
          const mean = sum / NP; for (let i = 0; i < NP; i++) sum2 += (vals[i] - mean) ** 2; const varx = sum2 / NP;
          if (md === 'packet') {
            const sx = md === 'packet' ? [-6 - 2 * a, 8 + 14 * (a + 0.2)] : [0, LBOX]; sH.setView(sx, [0, 0.5]);
            sH.hist(vals, { bins: 60, range: sx, density: true, color: 'accent', fillAlpha: 0.35 });
            const mu = 1, D = kT, m0 = a * mu * ts, v0 = 2 * D * ts; // Einstein-consistent prediction  μ = τ, D = kT τ
            if (ts > 0.3) sH.fn((x) => Math.exp(-((x - m0) ** 2) / (2 * Math.max(v0, 1e-3))) / Math.sqrt(2 * PI * Math.max(v0, 1e-3)), { color: 'orange', width: 2.4, domain: sx });
            sT.dot(mean, ts, { r: 6, color: 'gold' }); sH.vline(mean, { color: 'gold', width: 1.4 });
            // transport coefficients from the last 4τ (removes the ballistic start-up): μ = Δ⟨x⟩/(E Δt), D = Δvar/(2Δt)
            const wi = Math.min(si, Math.round(4 / DT)); let m1 = 0, v1 = 0;
            if (wi > 4) { let s1 = 0; for (let i = 0; i < NP; i++) s1 += S.X[(si - wi) * NP + i]; m1 = s1 / NP; let q1 = 0; for (let i = 0; i < NP; i++) q1 += (S.X[(si - wi) * NP + i] - m1) ** 2; v1 = q1 / NP; }
            const dt = wi * DT;
            st = { md, ts, mean, mu: dt > 1 && a > 0 ? (mean - m1) / (a * dt) : NaN, D: dt > 1 ? (varx - v1) / (2 * dt) : NaN, kT, a, dt };
          } else {
            sH.setView([0, LBOX], [0, Math.max(0.5, 1.3 / Math.max(0.0001, kT / Math.max(a, 0.02)))]);
            const nb = 25, cnt = new Array(nb).fill(0); for (const x of vals) cnt[Math.min(nb - 1, Math.floor((x / LBOX) * nb))]++;
            const dens = cnt.map((c) => c / NP / (LBOX / nb));
            sH.hist({ edges: Array.from({ length: nb + 1 }, (_, i) => (i * LBOX) / nb), counts: dens }, { color: 'accent', fillAlpha: 0.35 });
            const ell = kT / Math.max(a, 1e-3), Z = a > 0 ? ell * (1 - Math.exp(-LBOX / ell)) : LBOX;
            sH.fn((x) => (a > 0 ? Math.exp(-x / ell) / Z : 1 / LBOX), { color: 'orange', width: 2.4, domain: [0, LBOX] });
            // fit of ln(density) against x on the final state
            const pts = []; for (let b = 0; b < nb; b++) if (cnt[b] > 8) pts.push([((b + 0.5) * LBOX) / nb, Math.log(dens[b])]);
            let lf = NaN; if (pts.length > 3 && a > 0.02) { const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length; let sxy = 0, sxx = 0; for (const p of pts) { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2; } lf = -sxx / sxy; }
            st = { md, ts, lf, kT, a, ell };
          }
        }, { period: 14, still: 12 });
        v.readout(() => {
          const s = st; if (!s.md) return '';
          if (s.md === 'packet') return `$t=${v.fix(s.ts, 1)}\\tau$ · cloud centre $\\langle x\\rangle=${v.fix(s.mean, 2)}$ · measured over the last ${v.fix(s.dt, 0)} $\\tau$: mobility $\\mu=\\Delta\\langle x\\rangle/(E\\,\\Delta t)=${isNaN(s.mu) ? '—' : v.fix(s.mu, 3)}$ (Drude: $\\tau=1$), $D=\\Delta\\mathrm{var}/2\\Delta t=${isNaN(s.D) ? '—' : v.fix(s.D, 3)}$\n$D/\\mu=${isNaN(s.mu) ? '—' : v.fix(s.D / s.mu, 3)}$ against $k_BT/e=${v.fix(s.kT, 3)}$ (${v.fix(25.85 * s.kT, 1)} mV at this $T$) · the excess grows as $(eE\\lambda)^2$: field heating gives $D/\\mu=k_BT/e+(eE\\tau)^2\\tau/m=${v.fix(s.kT + s.a * s.a, 3)}$ here`;
          return `$t=${v.fix(s.ts, 0)}\\tau$ ${s.ts < 40 ? '(still relaxing: run to $t\\gtrsim50\\tau$)' : '(steady state)'} · profile fitted with $e^{-x/\\ell}$: $\\ell=${isNaN(s.lf) ? '—' : v.fix(s.lf, 2)}$ · Einstein prediction $\\ell=k_BT/eE=${v.fix(s.ell, 2)}$ (units of the thermal mean free path) · $eE\\ell/k_BT=${isNaN(s.lf) ? '—' : v.fix((s.a * s.lf) / s.kT, 3)}$ (equals 1 when $D/\\mu=k_BT/e$)`;
        });
      },
    },
  ],
};
