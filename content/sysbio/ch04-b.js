// Systems Biology — Chapter 4 (part 2): lambda switch, Waddington's landscape, titration, MAPK cascade, the toggle-switch paper (4.6-4.10)
import { rep, integrate, hillEff, gk1, gk2 } from './ch04.shared.js';

const pw = (x, n) => Math.pow(Math.max(x, 0), n);

import {lambdaParameters as LAM,lambdaRun,lambdaUV} from './sysbio-source-audit-lambda.shared.js';
import {toggleEquilibria as toggleRoots,toggleStart,togglePulse} from './sysbio-source-audit-toggle.shared.js';

// ── quasi-potential of a two-gene fate circuit by relaxing the Fokker–Planck equation on a grid ──
const FATE = { b: 0.5 };
const fateF = (a, s, x, y) => [a * x * x / (1 + x * x) + FATE.b / (1 + Math.pow(y, 4)) - x + s, a * y * y / (1 + y * y) + FATE.b / (1 + Math.pow(x, 4)) - y - s];
function fokkerPlanck(a, s, D, N = 48, L = 2.8, iters = 2600) {
  const h = L / N, P = new Float64Array(N * N).fill(1 / (N * N)), Q = new Float64Array(N * N);
  const fx = new Float64Array(N * N), fy = new Float64Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const d = fateF(a, s, (i + 0.5) * h, (j + 0.5) * h); fx[j * N + i] = d[0]; fy[j * N + i] = d[1]; }
  const dt = 0.2 * Math.min(h / 3.5, (h * h) / (4 * D));
  const flux = (k1, k2, ax) => { const w = 0.5 * (ax[k1] + ax[k2]); return w * (w > 0 ? P[k1] : P[k2]) - (D * (P[k2] - P[k1])) / h; };
  for (let it = 0; it < iters; it++) {
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const r = i < N - 1 ? flux(k, k + 1, fx) : 0, l = i > 0 ? flux(k - 1, k, fx) : 0, t = j < N - 1 ? flux(k, k + N, fy) : 0, b = j > 0 ? flux(k - N, k, fy) : 0;
      Q[k] = P[k] - (dt / h) * (r - l + t - b);
    }
    P.set(Q);
  }
  let mx = 0; for (const p of P) mx = Math.max(mx, p);
  const U = new Float64Array(N * N); for (let k = 0; k < N * N; k++) U[k] = -Math.log(Math.max(P[k] / mx, 1e-12));
  return { U, N, L, h, P };
}
const sampleU = (F, x, y) => {
  const gx = Math.min(F.N - 1.001, Math.max(0, x / F.h - 0.5)), gy = Math.min(F.N - 1.001, Math.max(0, y / F.h - 0.5));
  const i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j, U = F.U, N = F.N;
  return U[j * N + i] * (1 - fx) * (1 - fy) + U[j * N + i + 1] * fx * (1 - fy) + U[(j + 1) * N + i] * (1 - fx) * fy + U[(j + 1) * N + i + 1] * fx * fy;
};

export default {
  collection: 'sysbio',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Model',
      name: 'Lambda phage lysis–lysogeny decision',
      statement: String.raw`After bacteriophage $\lambda$ infects E. coli, lytic development can produce phage and lyse the cell, or a lysogenic state can maintain a prophage with most lytic genes repressed. CI supports lysogeny by repressing lytic promoters and activating its maintenance promoter $P_{RM}$; at higher occupancy CI also represses its own transcription. Cro regulates early transcription, including CII establishment of CI, and can directly repress $P_{RM}$. Infection and induction are distinct processes: initial fate also depends on CII, host physiology and infecting-virus number, while DNA-damaging induction inactivates CI. These facts do not follow from mutual repression alone.`,
      idea: String.raw`The chosen three-variable illustration has $\dot u=(0.05+6u^2/(1+u^2)+Ec)/(1+v^2)-(1+s)u$, $\dot v=8/(1+4u^2)-v$, $\dot c=m\kappa/(1+4u^2)-c$. Here u,v,c represent CI,Cro,CII-like levels. Multiplicity scales only CII synthesis, and E establishes CI; that selective scaling and sustained CII term are chosen simplifications, not measured genome-copy kinetics. Fixed cell-to-cell variability in kappa yields heterogeneous deterministic endpoints. For induction, s adds CI removal after time 20. A sampled endpoint change at time 100 does not by itself prove a bifurcation or predict a biological UV dose.`,
      caption: String.raw`Chosen model trajectories, not experimental data. Infection mode draws 24 of a fixed 60-member cohort from zero initial levels; green means CI exceeds Cro after 60 model units, red the reverse. Bars apply the same endpoint criterion to all 60 members at each m. Induction mode begins from the same relaxed CI-high state for every rate and adds CI removal after time 20. The right plot samples endpoints after 80 further units. Its marked transition is a finite-time grid observation, not an exact equilibrium threshold or a physical UV dose.`,
      deps: ['sysbio-4.2'],
      refs: ['Ptashne (2006), Current Biology16:R459–R462, Figure1 and switch overview R459–R461; Zeng et al. (2010), Cell141:682–691, Figures2–3/Results683–687 and host-context limitation687'],
      tags: ['phage lambda', 'cell fate', 'bistability'],
      scope: String.raw`Full Ptashne author review and full Zeng et al. original article checked. The toy omits CI negative autoregulation, DNA looping, separate promoter architecture, host proteases/CIII, growth, genome replication and actual cell lysis. Zeng et al. found multiplicity and cell size affect fate and supported a unanimous single-phage-vote model in the studied host; a dnaJ mutant changed the voting behavior. The displayed well-mixed cohort implements neither single-phage votes nor chemical reaction noise. Its 60-member fraction is a chosen model statistic, not an empirical probability or asymptotic fate guarantee. Concentrations, times and added CI removal are dimensionless model quantities.`,
      credit: 'M. Ptashne, 2006 (author review of lambda switch); L. Zeng, S. O. Skinner, C. Zong, J. Sippy, M. Feiss & I. Golding, 2010 (single-virus infection experiment); toy kinetics chosen here',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lambda_phage' },
      verify: false,
      viz(v) {
        const mode = v.select('experiment', [{ value: 'inf', label: 'infection (chosen m)' }, { value: 'uv', label: 'UV induction of a lysogen' }], 'inf');
        const M = v.slider('chosen infecting-genome count m', 1, 8, 3, { int: true });
        const Es = v.slider(String.raw`CII establishment strength`, 2, 8, 4.5, { step: 0.1 });
        const Sg = v.slider('cell-to-cell variability', 0.5, 3, 2.5, { step: 0.1 });
        const UV = v.slider('added CI removal rate s (model units)', 0, 3, 1.2, { step: 0.05 });
        const S1 = v.stage({ x: [0, 7], y: [0, 9], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 290, xlabel: 'CI', ylabel: 'Cro' });
        const S2 = v.stage({ x: [0, 9], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'phage per cell m', ylabel: 'fraction lysogenic' });
        const zs = [], r0 = v.rng(21); for (let i = 0; i < 60; i++) zs.push((r0() + r0() + r0() - 1.5) * 2);
        let key = '', frac = [], paths = [], ukey = '', ucurve = [], utr = [], info = null;
        const kOf = (z) => LAM.kap * Math.exp(0.25 * Sg.value * z);
        const run=(m,k,E,uv,y0,T,n,every)=>lambdaRun(m,k,E,uv,y0,T,.05,every===n?Math.round(T/.05):every);
        v.render(() => {
          const lys = mode.value === 'inf';
          M.el.hidden = !lys; Es.el.hidden = !lys; Sg.el.hidden = !lys; UV.el.hidden = lys;
          if (lys) {
            const k = `${Es.value}|${Sg.value}`;
            if (k !== key) {
              key = k; frac = [];
              for (let m = 1; m <= 8; m++) { let c = 0; zs.forEach((z) => { const tr = run(m, kOf(z), Es.value, 0, [0, 0, 0], 60, 600, 600); const y = tr[tr.length - 1]; if (y[1] > y[2]) c++; }); frac.push(c / zs.length); }
            }
            S1.setView([0, 7], [0, 9]); S1.setLabels('CI', 'Cro'); S2.setView([0, 9], [0, 1]); S2.setLabels('chosen genome count m', 'CI-dominant endpoint fraction');
            paths = [];
            const m = M.value; let nl = 0;
            zs.slice(0, 24).forEach((z) => {
              const tr = run(m, kOf(z), Es.value, 0, [0, 0, 0], 60, 1200, 8), y = tr[tr.length - 1], ok = y[1] > y[2];
              if (ok) nl++; paths.push({ pts: tr.map((r) => [r[1], r[2]]), ok });
            });
            S1.setView([0,Math.max(7,1.08*Math.max(...paths.flatMap(p=>p.pts.map(q=>q[0]))))],[0,Math.max(9,1.08*Math.max(...paths.flatMap(p=>p.pts.map(q=>q[1]))))]);
            paths.forEach((p) => S1.path(p.pts, { color: p.ok ? 'green' : 'red', width: 1.6, alpha: 0.75 }));
            paths.forEach((p) => S1.dot(p.pts[p.pts.length - 1][0], p.pts[p.pts.length - 1][1], { r: 4, color: p.ok ? 'green' : 'red' }));
            S1.text('CI-dominant endpoint', 6.9, 0.5, { size: 11, color: 'green', align: 'right' }); S1.text('Cro-dominant endpoint', 0.15, 8.6, { size: 11, color: 'red' });
            S2.bars(frac, { x0: 1, dx: 1, color: (val, i) => (i + 1 === m ? 'gold' : 'accent') });
            info = { lys: true, f: frac[m - 1], nl, n: paths.length };
          } else {
            const uk = 'u';
            if (ukey !== uk) {
              ukey = uk; ucurve = [];
              for (let i = 0; i <= 40; i++) { const s = (3 * i) / 40; const fin=lambdaUV(s).final; ucurve.push([s,...fin.slice(0,2)]); }
            }
            S1.setView([0, 100], [0, 9]); S1.setLabels('model time (extra CI removal from t = 20)', 'model level');
            const {all}=lambdaUV(UV.value);
            S1.vband(20, 100, { color: 'purple', alpha: 0.08 });
            S1.path(all.map((r) => [r[0], r[1]]), { color: 'green', width: 3 }); S1.path(all.map((r) => [r[0], r[2]]), { color: 'red', width: 3 });
            S1.text('extra CI loss', 22, 8.5, { size: 11, color: 'purple' });
            S2.setView([0, 3], [0, 9]); S2.setLabels('added CI removal rate s (model units)', 'CI (green) and Cro (red) after 80 time units');
            S2.path(ucurve.map((r) => [r[0], r[1]]), { color: 'green', width: 3 }); S2.path(ucurve.map((r) => [r[0], r[2]]), { color: 'red', width: 3 });
            S2.vline(UV.value, { color: 'gold', width: 2 });
            const fin = all[all.length - 1];
            const crit = ucurve.find((r) => r[2] > r[1]);
            info = { lys: false, crit: crit ? crit[0] : NaN, ci: fin[1], cro: fin[2] };
          }
        });
        v.legend([['green', 'CI-like level / endpoint'], ['red', 'Cro-like level / endpoint'], ['gold', 'chosen m or dose', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          if (info.lys) return `m = ${M.value}: **${v.fix(100 * info.f, 0)}%** of the fixed 60-member cohort have CI > Cro at time 60 (${info.nl} of the ${info.n} drawn paths) · fractions by m: ${frac.map((f, i) => `${i + 1}: ${v.fix(100 * f, 0)}%`).join(', ')}`;
          return `after 80 model time units of added CI removal: CI = ${v.fix(info.ci, 2)}, Cro = ${v.fix(info.cro, 2)} → **${info.cro > info.ci ? 'Cro-dominant endpoint' : 'CI-dominant endpoint'}**\nfirst sampled rate with Cro > CI at time 100 ≈ ${Number.isFinite(info.crit) ? v.fix(info.crit, 2) : '—'} (grid spacing 0.075; finite-time criterion, not a proven bifurcation or physical dose)`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Concept',
      name: 'Waddington’s landscape and cell-fate decisions',
      statement: String.raw`C. H. Waddington pictured development as a ball rolling down a **landscape** of branching valleys: the valleys are the cell fates, the ridges between them are the barriers that keep fates distinct, and a signal can tilt or reshape the surface. A gene circuit makes this picture quantitative. For a two-gene fate circuit with mutual repression and self-activation, the stable fixed points are the valleys, and the **quasi-potential** $U=-\ln P_{\rm ss}$ (with $P_{\rm ss}$ the steady-state distribution of the noisy circuit) is the height of the landscape. When the self-activation strength grows, the single "progenitor" valley can flatten and split into two fate valleys (a bifurcation); a signal that biases one gene deepens one valley and can make the progenitor valley vanish, which commits the cell.`,
      idea: String.raw`In a gradient system $\dot{\mathbf x}=-\nabla U$ the ball picture is literal. Gene circuits are generally not gradient systems (they have no potential), but with noise the long-run statistics are given by the stationary density $P_{\rm ss}$, and $U=-\ln P_{\rm ss}$ plays the role of the height, as in the potential-landscape treatments of Wang et al. and the bifurcation analysis of Huang et al. Here $P_{\rm ss}$ is computed by relaxing the Fokker–Planck equation on a grid. The valleys correspond to the stable states of 4.1 and 4.3, the saddles between them to the passes, and the splitting of the central valley to the pitchfork-type loss of stability of a monostable state; a differentiation signal acts as a bifurcation parameter.`,
      caption: String.raw`Left: quasi-potential of a two-gene circuit (dark = low, so valleys are dark) in the plane of the two gene products $x,y$; the gold marble starts in the progenitor valley and is kicked by noise. Right: the lowest height of the landscape at each position along the fate axis $x-y$ (the valley floor). Raise the self-activation $a$: the single central valley flattens into a progenitor shoulder flanked by two deeper fate valleys. Then turn the signal up: the progenitor valley tilts and disappears and the marble rolls into fate $x$ (use "release another marble" for new noise). The landscape is relaxed for 2600 pseudo-time steps from a uniform start, so relative depths of valleys separated by high barriers are only approximate.`,
      deps: ['sysbio-4.3'],
      refs: ['Alon: Positive Feedback, Bistability and Memory'],
      tags: ['cell fate', 'landscape', 'bifurcation'],
      scope: String.raw`A schematic circuit, $\dot x=a\,x^2/(1+x^2)+b/(1+y^4)-x+s$, $\dot y=a\,y^2/(1+y^2)+b/(1+x^4)-y-s$, with $b=0.5$ and additive noise of strength $D$ (my choice of form, in the spirit of published PU.1/GATA-1 models). The quasi-potential of a non-gradient system is not unique; $-\ln P_{\rm ss}$ is one standard choice and ignores the probability current.`,
      credit: 'C. H. Waddington, 1957 (The Strategy of the Genes); quasi-potentials: J. Wang, L. Xu & E. Wang, 2008 (PNAS 105: 12271); bifurcation view: S. Huang et al., 2007 (Dev. Biol. 305: 695)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Epigenetic_landscape' },
      viz(v) {
        const a = v.slider('self-activation strength a', 0.5, 2.5, 1.5, { step: 0.05 });
        const sg = v.slider('fate signal s (favours gene x)', -0.4, 0.4, 0, { step: 0.01 });
        const Dn = v.slider('noise D', 0.03, 0.12, 0.04, { step: 0.005 });
        let seed = 1; v.button('Release another marble', () => { seed++; });
        const S1 = v.stage({ x: [0, 2.8], y: [0, 2.8], equal: true, axes: 'box', gutter: true, height: 380, weight: 1.1, minWidth: 300, xlabel: 'gene x product', ylabel: 'gene y product' });
        const S2 = v.stage({ x: [-2.8, 2.8], y: [0, 8], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'fate axis  x − y', ylabel: 'U = −ln P (valley floor)' });
        let key = '', F = null, prof = [], mkey = '', marble = [];
        const relax = (A, S) => { let x = 1, y = 1; for (let i = 0; i < 4000; i++) { const d = fateF(A, S, x, y); x += 0.02 * d[0]; y += 0.02 * d[1]; } return [x, y]; };
        const compute = () => {
          const k = `${a.value}|${sg.value}|${Dn.value}`;
          if (k !== key) {
            key = k; F = fokkerPlanck(a.value, sg.value, Dn.value);
            const bins = 28, acc = new Float64Array(bins).fill(1e9);
            for (let j = 0; j < F.N; j++) for (let i = 0; i < F.N; i++) { const d = (i - j) * F.h, b = Math.min(bins - 1, Math.max(0, Math.floor(((d + 2.8) / 5.6) * bins))); acc[b] = Math.min(acc[b], F.U[j * F.N + i]); }
            prof = Array.from(acc, (u, b) => [-2.8 + ((b + 0.5) / bins) * 5.6, u]);
          }
          const mk = `${k}|${seed}`;
          if (mk !== mkey) {
            mkey = mk; const r = v.rng(100 + seed), st = relax(a.value, 0); let [x, y] = st; marble = [[x, y]];
            const dt = 0.02, sq = Math.sqrt(2 * Dn.value * dt), gauss = () => r.normal();
            for (let i = 0; i < 700; i++) { const d = fateF(a.value, sg.value, x, y); x = Math.min(2.8, Math.max(0, x + dt * d[0] + sq * gauss())); y = Math.min(2.8, Math.max(0, y + dt * d[1] + sq * gauss())); marble.push([x, y]); }
          }
        };
        let cur = null;
        v.animate((t) => {
          compute();
          S1.heat((x, y) => Math.min(sampleU(F, x, y), 8), { range: [0, 8], cmap: 'viridis', res: 3, key });
          const fp = (A, S) => { const out = []; for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) { let x = 0.25 * i, y = 0.25 * j; for (let k = 0; k < 1500; k++) { const d = fateF(A, S, x, y); x += 0.03 * d[0]; y += 0.03 * d[1]; } if (!out.some((q) => Math.hypot(q[0] - x, q[1] - y) < 0.05)) out.push([x, y]); } return out; };
          const at = fp(a.value, sg.value);
          at.forEach((q) => S1.dot(q[0], q[1], { r: 4, color: 'ink', hollow: true }));
          const k = Math.min(marble.length - 1, Math.round((t / 10) * (marble.length - 1)));
          S1.path(marble.slice(0, k + 1), { color: 'gold', width: 1.5, alpha: 0.8 });
          S1.dot(marble[k][0], marble[k][1], { r: 7, color: 'gold' });
          S2.path(prof, { color: 'accent', width: 3 });
          S2.dot(marble[k][0] - marble[k][1], Math.min(7.8, prof[Math.min(27, Math.max(0, Math.floor(((marble[k][0] - marble[k][1] + 2.8) / 5.6) * 28)))][1]), { r: 7, color: 'gold' });
          cur = { n: at.length, x: marble[k][0], y: marble[k][1], fate: Math.abs(marble[k][0] - marble[k][1]) < 0.4 ? 'progenitor' : marble[k][0] > marble[k][1] ? 'fate x' : 'fate y' };
        }, { period: 10, still: 9.9 });
        v.legend([['gold', 'noisy marble', { dot: true }], ['ink', 'attractors of the noise-free circuit', { dot: true }]]);
        v.readout(() => (cur ? `${cur.n} attractor${cur.n === 1 ? '' : 's'} of the noise-free circuit (white dots) · marble at (${v.fix(cur.x, 2)}, ${v.fix(cur.y, 2)}) → **${cur.fate}**` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Ultrasensitivity by molecular titration',
      statement: String.raw`Suppose an activator $A$ (total concentration $A_T$) is bound one-to-one and very tightly (dissociation constant $K_d\ll I_T$) by an inhibitor $I$ (total $I_T$) into an inactive complex. Mass action gives the free activator
$$A_{\rm free}=\tfrac12\Bigl[(A_T-I_T-K_d)+\sqrt{(A_T-I_T-K_d)^2+4K_dA_T}\Bigr],$$
which for $K_d\to0$ becomes **threshold-linear**: $A_{\rm free}=\max(0,\,A_T-I_T)$. A downstream gene that responds to free activator with an ordinary non-cooperative input function $A_{\rm free}/(K+A_{\rm free})$ then responds to $A_T$ much more steeply than a Hill function with $n=1$: the effective Hill coefficient (measured by $\ln 81/\ln({\rm EC}_{90}/{\rm EC}_{10})$) rises well above 1 as $K_d/I_T$ and $K/I_T$ fall.`,
      idea: String.raw`Below the threshold $A_T<I_T$ every activator molecule meets a free inhibitor and is sequestered, so almost nothing is free; once $A_T$ exceeds $I_T$ the inhibitor is used up and each added activator molecule stays free. The kink at $A_T=I_T$ is the sharpest possible response of this kind; weaker binding ($K_d$ comparable to $I_T$) rounds it off. Because the output is a function of $A_{\rm free}$, the response is a sharp rise followed by saturation, which is ultrasensitivity without any cooperativity in binding — the titration route to a switch, as an alternative to the cooperative Hill input functions of 1.3 and 1.10. Together with a positive feedback loop (4.1) it is a way to build the sigmoid nonlinearity that bistability requires.

The elementary bimolecular mass-action rule (kin 1.3) gives association flux $k_{\rm on}A_{\rm free}I_{\rm free}$ and dissociation flux $k_{\rm off}C$ for the complex. At equilibrium, with $A_T=A_{\rm free}+C$ and $I_T=I_{\rm free}+C$, eliminating C yields the quadratic for the nonnegative free-activator root displayed above. This uses dilute ideal concentrations, one-to-one binding and a conserved total for each partner; adding production, removal or nonideal binding would require a different balance.`,
      caption: String.raw`**Left**: free activator against total activator, with the threshold-linear limit $\max(0,A_T-I_T)$ dashed and the no-inhibitor line $A_{\rm free}=A_T$ in grey (here $I_T=1$). **Right**: the output of a downstream non-cooperative gene, on a logarithmic axis, against the Hill curve with $n=1$ that has the same half-point. Slide $K_d$ down to make the knee sharp and read off the effective Hill coefficient; slide the gene's own constant $K$ down to make it sharper still; set $K_d$ large and the response relaxes to the ordinary $n\approx1$ curve.`,
      deps: ['sysbio-4.1', 'kin-1.3'],
      refs: ['Alon: Positive Feedback, Bistability and Memory'],
      tags: ['ultrasensitivity', 'titration', 'sequestration'],
      scope: String.raw`Equilibrium binding with one inhibitor per activator, no degradation of the complex, and an output with a fast, non-cooperative response to free activator. Real sequestration circuits (sigma/anti-sigma factors, toxin–antitoxin pairs, microRNAs) add production and decay of both partners, which smooths the threshold.`,
      credit: 'N. E. Buchler & M. Louis, 2008 (J. Mol. Biol. 384: 1106–1119); N. E. Buchler & F. R. Cross, 2009 (Mol. Syst. Biol. 5: 272)',
      links: { doi: 'https://doi.org/10.1016/j.jmb.2008.09.079' },
      viz(v) {
        const lKd = v.slider(String.raw`binding $K_d/I_T$ (log₁₀)`, -3, 1, -2, { step: 0.05, fmt: (x) => (Math.pow(10, x) < 0.1 ? Math.pow(10, x).toExponential(1) : v.fix(Math.pow(10, x), 2)) });
        const lK = v.slider(String.raw`gene constant $K/I_T$ (log₁₀)`, -2, 1, -1, { step: 0.05, fmt: (x) => (Math.pow(10, x) < 0.1 ? Math.pow(10, x).toExponential(1) : v.fix(Math.pow(10, x), 2)) });
        const free = (A, Kd) => { const d = A - 1 - Kd; return 0.5 * (d + Math.sqrt(d * d + 4 * Kd * A)); };
        const S1 = v.stage({ x: [0, 3], y: [0, 2], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'total activator A_T (units of I_T)', ylabel: 'free activator' });
        const S2 = v.stage({ x: [0.01, 100], xlog: true, y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 280, xlabel: 'total activator A_T (units of I_T)', ylabel: 'gene output' });
        let info = null;
        v.render(() => {
          const Kd = Math.pow(10, lKd.value), K = Math.pow(10, lK.value);
          S1.line(0, 0, 3, 3, { color: 'faint', width: 1.5 });
          S1.fn((A) => Math.max(0, A - 1), { color: 'muted', dash: true, width: 2 });
          S1.fn((A) => free(A, Kd), { color: 'green', width: 3 });
          S1.vline(1, { color: 'orange', dash: true }); S1.text('A_T = I_T', 1.03, 1.85, { size: 11, color: 'orange' });
          const R = (A) => { const f = free(A, Kd); return f / (K + f); };
          const R0 = (A) => A / (K + A);
          const half = (() => { let lo = 1e-6, hi = 1e6; const tgt = 0.5 * R(1e6); for (let i = 0; i < 80; i++) { const m = Math.sqrt(lo * hi); if (R(m) < tgt) lo = m; else hi = m; } return Math.sqrt(lo * hi); })();
          S2.fn((A) => A / (half + A), { color: 'muted', dash: true, width: 2 });
          S2.fn(R, { color: 'green', width: 3 });
          S2.vline(1, { color: 'orange', dash: true });
          const nH = hillEff(R, 1e-6, 1e6), nH0 = hillEff(R0, 1e-6, 1e6);
          info = { nH, nH0, Kd, K, half };
        });
        v.legend([['green', 'with titration'], ['muted', 'Hill n = 1, same half-point', { dash: true }], ['orange', 'A_T = I_T', { dash: true }]]);
        v.readout(() => (info ? `effective Hill coefficient of the output: **${v.fix(info.nH, 2)}** (the gene alone: ${v.fix(info.nH0, 2)}, a Hill function with $n=1$: 1.00) · half-point at $A_T=${v.fix(info.half, 2)}\\,I_T$` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'MAPK cascade ultrasensitivity',
      statement: String.raw`In the mitogen-activated protein kinase (MAPK) cascade a kinase (MAPKKK) activated by an input phosphorylates the next kinase (MAPKK) on two sites, which in turn phosphorylates MAPK on two sites; each level is reversed by a phosphatase. Even when no enzyme is cooperative, the stimulus–response curve of the *last* level is much steeper than that of the first: in the numerical model of Huang and Ferrell and in their measurements on *Xenopus* oocyte extracts the final response was as steep as that of an enzyme with Hill coefficient of about 4–5. The steepening comes from two sources: **zero-order (saturation) ultrasensitivity** of each covalent-modification cycle (Goldbeter–Koshland) and **multi-step phosphorylation**, whose two steps must both occur; and each level feeds the next with its own steep curve, so the steepness compounds.`,
      idea: String.raw`A single modification cycle of a protein with Michaelis constants small compared with its total concentration is an ultrasensitive switch (mathbio-5.10). When each of the two steps of a dual cycle is zero-order, and the activity of the kinase at one level is proportional to the doubly modified fraction at the previous level, the stimulus–response curve at level $k$ is a steep function of a steep function. At steady state the cycle can be solved by balance of the opposing fluxes $g(X_1)=r_1\,g(X_0)$, $g(X_2)=r_2\,g(X_1)$ with $g(x)=x/(K_m+x)$, which this picture solves exactly for the model below (a quasi-steady-state, non-competitive caricature, not the 22-equation mass-action model of the paper). Because the effective Hill coefficient of each level is measured from its 10% and 90% response points, the compounding of the three levels can be read off directly.

The chain rule (pma 5.5) explains local steepness in a nested cascade: on positive differentiable single-valued steady-state branches, the logarithmic derivative of a composite response is the product of the logarithmic derivatives of its stages. This is a local sensitivity identity. It does not say that the three global 10-to-90-percent effective Hill coefficients multiply exactly, nor that this reduced noncompetitive cascade reproduces the detailed measured system.`,
      caption: String.raw`The three levels' response to the input (log axis), each normalised to its own maximum. Move $K_m$ (in units of the total substrate) toward 0 to put the cycles into the zero-order regime: every level steepens, and the last one the most. The right panel reports the effective Hill coefficients of the three levels. Put $K_m$ above 1 or $c$ near 1 and the cascade collapses to nearly hyperbolic curves. A dashed Hill curve with $n=1$ is shown for comparison.`,
      deps: ['mathbio-5.10', 'pma-5.5'],
      refs: ['Alon: Robust Signalling'],
      tags: ['ultrasensitivity', 'MAPK', 'signal transduction'],
      scope: String.raw`A simplified steady-state model: Michaelis–Menten fluxes without enzyme–substrate complexes or substrate competition, fully distributive double phosphorylation, no feedback or retroactivity, and the same ratio $c$ of kinase to phosphatase activity at every level. The numbers it produces are illustrative; the Hill coefficient of 4–5 is the published value for the paper's detailed model and extracts.`,
      credit: 'C.-Y. F. Huang & J. E. Ferrell Jr., 1996 (PNAS 93: 10078–10083); A. Goldbeter & D. E. Koshland Jr., 1981 (PNAS 78: 6840–6844)',
      links: { doi: 'https://doi.org/10.1073/pnas.93.19.10078' },
      viz(v) {
        const lKm = v.slider(String.raw`Michaelis constant $K_m$ (fraction of total substrate)`, -2, 0.7, -0.3, { step: 0.02, fmt: (x) => v.fix(Math.pow(10, x), 2) });
        const lc = v.slider('coupling c (kinase ÷ phosphatase activity per unit input)', 0, 1, 0.48, { step: 0.01, fmt: (x) => v.fix(Math.pow(10, x), 1) });
        const S1 = v.stage({ x: [0.001, 1000], xlog: true, y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 300, xlabel: 'input signal (relative units)', ylabel: 'active fraction at each level' });
        const S2 = v.stage({ x: [0.4, 3.6], y: [0, 6], axes: 'box', gutter: true, height: 340, weight: 0.8, minWidth: 220, xticks: [[1, 'MAPKKK'], [2, 'MAPKK'], [3, 'MAPK']], ylabel: 'effective Hill coefficient' });
        let info = null;
        v.render(() => {
          const Km = Math.pow(10, lKm.value), c = Math.pow(10, lc.value);
          const lv = (s) => { const a1 = gk1(s, Km), x2 = gk2(c * a1, c * a1, Km)[2], x3 = gk2(c * x2, c * x2, Km)[2]; return [a1, x2, x3]; };
          const R = [0, 1, 2].map((k) => (s) => lv(s)[k]);
          const mx = [0, 1, 2].map((k) => lv(1e6)[k]);
          const col = ['orange', 'accent', 'green'], nm = ['MAPKKK (1 site)', 'MAPKK (2 sites)', 'MAPK (2 sites)'];
          const nh = [];
          for (let k = 0; k < 3; k++) {
            S1.fn((s) => R[k](s) / mx[k], { color: col[k], width: 3 });
            nh.push(hillEff((s) => R[k](s) / mx[k], 1e-6, 1e6));
          }
          const half1 = (() => { let lo = 1e-6, hi = 1e6; for (let i = 0; i < 70; i++) { const m = Math.sqrt(lo * hi); if (R[2](m) / mx[2] < 0.5) lo = m; else hi = m; } return Math.sqrt(lo * hi); })();
          S1.fn((s) => s / (half1 + s), { color: 'muted', dash: true, width: 1.8 });
          S2.bars(nh.map((x) => Math.min(x, 5.9)), { x0: 1, dx: 1, color: (val, i) => col[i] });
          S2.hline(1, { color: 'muted', dash: true }); S2.hline(4.5, { color: 'red', dash: true, alpha: 0.7 }); S2.text('Huang & Ferrell: 4–5', 0.5, 4.75, { size: 10, color: 'red', align: 'left' });
          info = { nh, nm };
        });
        v.legend([['orange', 'level 1: MAPKKK'], ['accent', 'level 2: MAPKK'], ['green', 'level 3: MAPK'], ['muted', 'Hill n = 1', { dash: true }]]);
        v.readout(() => (info ? `effective Hill coefficients: ${info.nh.map((x, i) => `${info.nm[i]} **${v.fix(x, 2)}**`).join(' → ')} (a hyperbola has 1)` : ''));
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Paper',
      name: 'Construction of a Genetic Toggle Switch in E. coli',
      paper: { authors: 'Timothy S. Gardner, Charles R. Cantor and James J. Collins', year: 2000, title: 'Construction of a genetic toggle switch in Escherichia coli', venue: 'Nature 403 (6767): 339–342', doi: '10.1038/35002131' },
      introduces: ['sysbio-4.2', 'sysbio-4.3'],
      statement: String.raw`Gardner, Cantor and Collins built a **synthetic bistable gene circuit** in *Escherichia coli*: two repressible promoters arranged so that each drives the repressor of the other. They gave a simple model,
$$\dot u=\frac{\alpha_1}{1+v^{\,\beta}}-u,\qquad \dot v=\frac{\alpha_2}{1+u^{\,\gamma}}-v,$$
whose nullcline analysis explains the need for cooperative repression and balanced synthesis rates, and showed experimentally that the circuit can be flipped between its two states by a transient chemical or thermal induction and then holds the state, with a nearly ideal switching threshold. The toggle was proposed as an addressable cellular memory unit.`,
      idea: String.raw`By 2000 multistability was known in natural switches such as the $\lambda$ lysis–lysogeny decision (4.6), but it was not known whether it could be engineered from non-specialised parts. Box1 gives the dimensionless model and geometric design argument. Both pTAK (LacI/temperature-sensitive CI) and pIKE (LacI/TetR) variants were built; pTAK uses IPTG/heat and pIKE IPTG/aTc. Five of six tested toggles were bistable. The inequality $\beta\gamma>1$ follows from the loop-gain bound of 4.3; it is a necessary refinement for this model, not a sufficient design guarantee or a verbatim condition printed in Box1. Two inducers acting on the two repressors play the role of the pulses of 4.2. Published in the same issue as the repressilator, the paper helped found synthetic biology: a circuit designed on paper from a model, built from parts, and validated by its behaviour.`,
      caption: String.raw`**Left**: the model's phase plane for the chosen $\alpha_1,\alpha_2,\beta,\gamma$, with nullclines and steady states; the gold dot is the cell's state. Press **IPTG-like pulse** (rescales u as a LacI-like repressor) or **heat-like pulse** (rescales v as a CI-like repressor). Each chosen pulse lasts 20 model units followed by 40 without induction. Switching can fail; the readout reports the finite endpoint and its ODE residual. Changing a parameter resets to a current-model equilibrium. **Right**: the design map in the $(\alpha_1,\alpha_2)$ plane for the current $\beta,\gamma$ (green: bistable; drag the white handle, or use the sliders). The map is computed from the model here; it is not digitised from the paper, with illustrative symmetric defaults. Figure5’s original fit uses $\alpha_1=156.25,\alpha_2=15.6,\beta=2.5,\gamma=1$ and a separate IPTG binding law; that fit is not reproduced here. With $\beta\gamma\le1$ the green region is empty.`,
      deps: ['sysbio-4.1', 'mathbio-6.6'],
      refs: ['Gardner, Cantor & Collins (2000), original Nature403:339–342: Box1 p339; Figures2–3/pTAK-pIKE p340; Figures4–5 memory/threshold p341; Figure6 and Methods p342'],
      tags: ['synthetic biology', 'toggle switch', 'bistability'],
      scope: String.raw`The complete original four-page paper was read, including Box1 and all six figures. Experiments used plasmid circuits in E. coli JM2.300 with GFPmut3 flow-cytometry readout. Original Figure4 follows finite memory, including 22 hours without inducer; Figures5–6 show a noisy threshold and asymmetric switching times. Neither eternal memory nor perfect discontinuity was measured. The displayed symmetric rates, 11-fold repressor rescaling, pulse 20/recovery 40 and design-map raster are chosen illustrations, not the original fit, real temperature protocol or hours. Root isolation uses analytic loop-gain partitions; the colored raster remains a finite sampling of parameter space. Marginal fold roots are separately labeled.`,
      credit: 'Timothy S. Gardner, Charles R. Cantor & James J. Collins, 2000',
      links: { doi: 'https://doi.org/10.1038/35002131', wikipedia: 'https://en.wikipedia.org/wiki/Genetic_toggle_switch' },
      verify: false,
      viz(v) {
        const lb = v.slider(String.raw`$\beta$ (cooperativity of $v$ repressing $u$)`, 0.5, 4, 2, { step: 0.05 });
        const lg = v.slider(String.raw`$\gamma$ (cooperativity of $u$ repressing $v$)`, 0.5, 4, 2, { step: 0.05 });
        const a1s = v.slider(String.raw`$\alpha_1$ (synthesis of $u$)`, 1, 300, 10, { log: true, sig: 2 });
        const a2s = v.slider(String.raw`$\alpha_2$ (synthesis of $v$)`, 1, 300, 10, { log: true, sig: 2 });
        const L = v.stage({ x: [0, 11], y: [0, 11], axes: 'box', gutter: true, height: 360, weight: 1.1, minWidth: 280, xlabel: 'repressor 1  u', ylabel: 'repressor 2  v' });
        const Rg = v.stage({ x: [1, 300], xlog: true, y: [1, 300], ylog: true, axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 280, xlabel: 'α₁', ylabel: 'α₂', title: 'design map: where the toggle is bistable' });
        const hd = Rg.handle(10, 10, { color: 'ink', r: 8 });
        let st={u:10,v:.1},trail=[],last='',info=null,paramKey='',residual=0;
        const stateOf = () => (st.u > st.v ? 'u high' : 'v high');
        const pulse = (sg) => {
          const result=togglePulse(a1s.value,a2s.value,lb.value,lg.value,[st.u,st.v],sg);
          trail=result.path;st={u:result.final[0],v:result.final[1]};residual=result.residual;
          last=sg>0?'IPTG-like pulse':'heat-like pulse';
        };
        v.button('IPTG-like pulse (inactivate u)', () => pulse(1));
        v.button('heat-like pulse (inactivate v)', () => pulse(-1));
        v.button('Reset',()=>{const q=toggleStart(a1s.value,a2s.value,lb.value,lg.value);st={u:q[0],v:q[1]};trail=[];last='';residual=0;});
        let syncing = false;
        v.render(() => {
          const A1 = a1s.value, A2 = a2s.value, b = lb.value, g = lg.value;
          // keep the handle and the sliders in step
          if (!syncing && (Math.abs(Math.log(hd.x / A1)) > 1e-6 || Math.abs(Math.log(hd.y / A2)) > 1e-6)) {
            if (hd.dragging) { syncing = true; a1s.set(Math.min(300, Math.max(1, hd.x))); a2s.set(Math.min(300, Math.max(1, hd.y))); syncing = false; } else hd.set(A1, A2);
          }
          const pk=`${A1}|${A2}|${b}|${g}`;if(pk!==paramKey){paramKey=pk;const q=toggleStart(A1,A2,b,g);st={u:q[0],v:q[1]};trail=[];last='';residual=0;}
          const m = 1.12 * Math.max(A1, A2, 2); L.setView([0, m], [0, m]);
          L.fn((x) => A2 * rep(x, g), { color: 'purple', width: 2.2 });
          L.curve((y) => [A1 * rep(y, b), y], 0, m, { color: 'orange', width: 2.2, n: 300 });
          const roots = toggleRoots(A1, A2, b, g);
          roots.forEach((r) => L.dot(r.u, r.v, { r: 6, color: r.marginal?'gold':r.stable ? 'green' : 'red', hollow: !r.stable }));
          if (trail.length) L.path(trail, { color: 'gold', width: 2 });
          L.dot(st.u, st.v, { r: 7, color: 'gold' });
          Rg.raster((x, y) => (toggleRoots(x, y, b, g, 0, 160).filter((r) => r.stable).length >= 2 ? [...v.rgb('green').slice(0, 3), 90] : null), { res: 4, key: `${b}|${g}` });
          info={k:roots.length,s:roots.filter(r=>r.stable).length,marginal:roots.filter(r=>r.marginal).length,bg:b*g};
        });
        v.legend([['orange', 'u-nullcline'], ['purple', 'v-nullcline'], ['gold', 'cell state', { dot: true }]]);
        v.readout(() => (info ? `$\\beta\\gamma=${v.fix(info.bg, 2)}$ — necessary loop-gain condition for this model: $\\beta\\gamma>1$ (${info.bg > 1 ? 'met' : 'not met'}); this circuit: ${info.k} steady state${info.k === 1 ? '' : 's'}, ${info.s} strictly stable, ${info.marginal} marginal → **${info.s>=2?'bistable':info.marginal?'boundary / marginal':'monostable'}**\nfinite endpoint dominance: **${stateOf()}**${last?` (after the last ${last}; uninduced ODE residual ${v.fix(residual,6)})`:' (current-model equilibrium)'}` : ''));
      },
    },
  ],
};
