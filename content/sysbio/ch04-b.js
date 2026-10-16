// Systems Biology — Chapter 4 (part 2): lambda switch, Waddington's landscape, titration, MAPK cascade, the toggle-switch paper (4.6-4.10)
import { rep, toggleRoots, integrate, hillEff, gk1, gk2 } from './ch04.shared.js';

const pw = (x, n) => Math.pow(Math.max(x, 0), n);

// ── lambda decision model (illustrative): u = CI, v = Cro, c = CII; m = number of phage genomes in the cell ──
const LAM = { eps: 0.05, A: 6, V: 8, dc: 1, kap: 1.5 };
const lamF = (m, kap, E, uv) => (y) => {
  const [u, v, c] = y;
  return [(LAM.eps + LAM.A * u * u / (1 + u * u) + E * c) / (1 + v * v) - (1 + uv) * u, LAM.V / (1 + 4 * u * u) - v, m * kap / (1 + 4 * u * u) - LAM.dc * c];
};

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
      statement: String.raw`After bacteriophage $\lambda$ infects *E. coli* it either **lyses** the cell (producing new phage) or becomes a **lysogen** (its genome integrates, silent, and is copied with the host). The decision is made by a bistable switch: the repressor CI (maintained by its own positive feedback, since CI activates its promoter $P_{RM}$) represses the lytic genes, including *cro*, while Cro represses *cI*. Two classical facts follow from this double-negative loop. (i) A cell infected by *several* phage is more likely to choose lysogeny, because the early regulator CII, which establishes CI synthesis, accumulates with the number of genomes. (ii) A lysogen is stable for generations but switches to lysis when DNA damage (UV) activates RecA, which makes CI cleave itself: lowering CI past a threshold removes the lysogenic state.`,
      idea: String.raw`Treat CI ($u$), Cro ($v$) and CII ($c$) as in 4.2, with extra terms: CI's promoter has a positive-feedback term and a CII-driven establishment term and is repressed by Cro; Cro's promoter is repressed by CI (strongly, through cooperative binding); CII is made from the same promoter as Cro and is lost at a fixed rate. The number of genomes $m$ scales CII production. After infection every cell starts with no CI, Cro or CII; a race follows between CI establishment and Cro build-up, and cell-to-cell variation in the CII rate decides who wins, which turns a deterministic switch into a fraction of lysogens that increases with $m$. In a lysogen, extra loss of CI at rate $(1+s)$ (UV) shrinks the high-CI state until it disappears in a saddle–node bifurcation (as in 4.4), and Cro takes over.`,
      caption: String.raw`Switch between **infection** and **UV induction**. *Infection*: each curve is a simulated cell in the $(\text{CI},\text{Cro})$ plane for the chosen number of phage $m$ (green: ends lysogenic, red: lytic); the bars on the right give the fraction of 60 cells choosing lysogeny at every $m$. Raise $m$ and more cells reach the CI-high state; make cells more uniform and the response sharpens. *UV induction*: a lysogen is exposed to UV from time 20 on; right: final CI against dose, with the dose of the slider marked. This is a qualitative caricature: its parameters are chosen to show the logic, not fitted to $\lambda$.`,
      deps: ['sysbio-4.2'],
      refs: ['Alon: Positive Feedback, Bistability and Memory'],
      tags: ['phage lambda', 'cell fate', 'bistability'],
      scope: String.raw`Toy three-variable model, not a quantitative model of $\lambda$: it omits the CI dimer/octamer DNA looping, the $P_{RE}$/$P_{L}$ architecture, CIII, host proteases and growth. Zeng et al. (2010) showed that in real cells the decision is taken virus by virus and then combined, so the single-cell picture here is a simplification.`,
      credit: 'Ptashne (A Genetic Switch); multiplicity dependence: P. Kourilsky, 1973; single-virus decisions: L. Zeng et al., 2010 (Cell 141: 682–691)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lambda_phage' },
      verify: true,
      viz(v) {
        const mode = v.select('experiment', [{ value: 'inf', label: 'infection (MOI)' }, { value: 'uv', label: 'UV induction of a lysogen' }], 'inf');
        const M = v.slider('phage genomes per cell m (MOI)', 1, 8, 3, { int: true });
        const Es = v.slider(String.raw`CII establishment strength`, 2, 8, 4.5, { step: 0.1 });
        const Sg = v.slider('cell-to-cell variability', 0.5, 3, 2.5, { step: 0.1 });
        const UV = v.slider('UV dose (CI cleavage rate)', 0, 3, 1.2, { step: 0.05 });
        const S1 = v.stage({ x: [0, 7], y: [0, 9], axes: 'box', gutter: true, height: 340, weight: 1.2, minWidth: 290, xlabel: 'CI', ylabel: 'Cro' });
        const S2 = v.stage({ x: [0, 9], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'phage per cell m', ylabel: 'fraction lysogenic' });
        const zs = [], r0 = v.rng(21); for (let i = 0; i < 60; i++) zs.push((r0() + r0() + r0() - 1.5) * 2);
        let key = '', frac = [], paths = [], ukey = '', ucurve = [], utr = [], info = null;
        const kOf = (z) => LAM.kap * Math.exp(0.25 * Sg.value * z);
        const run = (m, k, E, uv, y0, T, n, every) => integrate(lamF(m, k, E, uv), y0, T, n, every);
        v.render(() => {
          const lys = mode.value === 'inf';
          M.el.hidden = !lys; Es.el.hidden = !lys; Sg.el.hidden = !lys; UV.el.hidden = lys;
          if (lys) {
            const k = `${Es.value}|${Sg.value}`;
            if (k !== key) {
              key = k; frac = [];
              for (let m = 1; m <= 8; m++) { let c = 0; zs.forEach((z) => { const tr = run(m, kOf(z), Es.value, 0, [0, 0, 0], 60, 600, 600); const y = tr[tr.length - 1]; if (y[1] > y[2]) c++; }); frac.push(c / zs.length); }
            }
            S1.setView([0, 7], [0, 9]); S1.setLabels('CI', 'Cro'); S2.setView([0, 9], [0, 1]); S2.setLabels('phage per cell m', 'fraction lysogenic');
            paths = [];
            const m = M.value; let nl = 0;
            zs.slice(0, 24).forEach((z) => {
              const tr = run(m, kOf(z), Es.value, 0, [0, 0, 0], 60, 1200, 8), y = tr[tr.length - 1], ok = y[1] > y[2];
              if (ok) nl++; paths.push({ pts: tr.map((r) => [r[1], r[2]]), ok });
            });
            paths.forEach((p) => S1.path(p.pts, { color: p.ok ? 'green' : 'red', width: 1.6, alpha: 0.75 }));
            paths.forEach((p) => S1.dot(p.pts[p.pts.length - 1][0], p.pts[p.pts.length - 1][1], { r: 4, color: p.ok ? 'green' : 'red' }));
            S1.text('lysogeny: CI high', 6.9, 0.5, { size: 11, color: 'green', align: 'right' }); S1.text('lysis: Cro high', 0.15, 8.6, { size: 11, color: 'red' });
            S2.bars(frac, { x0: 1, dx: 1, color: (val, i) => (i + 1 === m ? 'gold' : 'accent') });
            info = { lys: true, f: frac[m - 1], nl, n: paths.length };
          } else {
            const uk = 'u';
            if (ukey !== uk) {
              ukey = uk; ucurve = [];
              for (let i = 0; i <= 40; i++) { const s = (3 * i) / 40; const tr = run(1e-9, LAM.kap, 0, s, [3.5, 0.5, 0], 80, 800, 800); ucurve.push([s, tr[tr.length - 1][1], tr[tr.length - 1][2]]); }
            }
            S1.setView([0, 100], [0, 9]); S1.setLabels('time after infection-free growth (UV from t = 20)', 'level');
            utr = run(1e-9, LAM.kap, 0, 0, [3.5, 0.5, 0], 20, 200, 4).map((r) => [r[0], r[1], r[2]]);
            const last = utr[utr.length - 1];
            const after = integrate(lamF(1e-9, LAM.kap, 0, UV.value), [last[1], last[2], 0], 80, 800, 4).map((r) => [r[0] + 20, r[1], r[2]]);
            const all = utr.concat(after);
            S1.vband(20, 100, { color: 'purple', alpha: 0.08 });
            S1.path(all.map((r) => [r[0], r[1]]), { color: 'green', width: 3 }); S1.path(all.map((r) => [r[0], r[2]]), { color: 'red', width: 3 });
            S1.text('UV on', 22, 8.5, { size: 11, color: 'purple' });
            S2.setView([0, 3], [0, 9]); S2.setLabels('UV dose (CI cleavage rate)', 'CI (green) and Cro (red) after 80 time units');
            S2.path(ucurve.map((r) => [r[0], r[1]]), { color: 'green', width: 3 }); S2.path(ucurve.map((r) => [r[0], r[2]]), { color: 'red', width: 3 });
            S2.vline(UV.value, { color: 'gold', width: 2 });
            const fin = all[all.length - 1];
            const crit = ucurve.find((r) => r[2] > r[1]);
            info = { lys: false, crit: crit ? crit[0] : NaN, ci: fin[1], cro: fin[2] };
          }
        });
        v.legend([['green', 'CI / lysogeny'], ['red', 'Cro / lysis'], ['gold', 'chosen m or dose', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          if (info.lys) return `m = ${M.value}: **${v.fix(100 * info.f, 0)}%** of the 60 cells choose lysogeny (${info.nl} of the ${info.n} drawn paths) · fractions by m: ${frac.map((f, i) => `${i + 1}: ${v.fix(100 * f, 0)}%`).join(', ')}`;
          return `lysogen after 80 time units at this dose: CI = ${v.fix(info.ci, 2)}, Cro = ${v.fix(info.cro, 2)} → **${info.cro > info.ci ? 'induced into lysis' : 'stays lysogenic'}**\ncritical dose in this model ≈ ${Number.isFinite(info.crit) ? v.fix(info.crit, 2) : '—'} (below it the high-CI state survives)`;
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
        v.legend([['gold', 'noisy marble', { dot: true }], ['ink', 'fixed points of the circuit', { dot: true }]]);
        v.readout(() => (cur ? `${cur.n} attractor${cur.n === 1 ? '' : 's'} of the noise-free circuit (hollow dots; saddles also appear in the list when the relaxation stalls) · marble at (${v.fix(cur.x, 2)}, ${v.fix(cur.y, 2)}) → **${cur.fate}**` : ''));
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
      idea: String.raw`Below the threshold $A_T<I_T$ every activator molecule meets a free inhibitor and is sequestered, so almost nothing is free; once $A_T$ exceeds $I_T$ the inhibitor is used up and each added activator molecule stays free. The kink at $A_T=I_T$ is the sharpest possible response of this kind; weaker binding ($K_d$ comparable to $I_T$) rounds it off. Because the output is a function of $A_{\rm free}$, the response is a sharp rise followed by saturation, which is ultrasensitivity without any cooperativity in binding — the titration route to a switch, as an alternative to the cooperative Hill input functions of 1.3 and 1.10. Together with a positive feedback loop (4.1) it is a way to build the sigmoid nonlinearity that bistability requires.`,
      caption: String.raw`**Left**: free activator against total activator, with the threshold-linear limit $\max(0,A_T-I_T)$ dashed and the no-inhibitor line $A_{\rm free}=A_T$ in grey (here $I_T=1$). **Right**: the output of a downstream non-cooperative gene, on a logarithmic axis, against the Hill curve with $n=1$ that has the same half-point. Slide $K_d$ down to make the knee sharp and read off the effective Hill coefficient; slide the gene's own constant $K$ down to make it sharper still; set $K_d$ large and the response relaxes to the ordinary $n\approx1$ curve.`,
      deps: ['sysbio-4.1'],
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
      idea: String.raw`A single modification cycle of a protein with Michaelis constants small compared with its total concentration is an ultrasensitive switch (mathbio-5.10). When each of the two steps of a dual cycle is zero-order, and the activity of the kinase at one level is proportional to the doubly modified fraction at the previous level, the stimulus–response curve at level $k$ is a steep function of a steep function. At steady state the cycle can be solved by balance of the opposing fluxes $g(X_1)=r_1\,g(X_0)$, $g(X_2)=r_2\,g(X_1)$ with $g(x)=x/(K_m+x)$, which this picture solves exactly for the model below (a quasi-steady-state, non-competitive caricature, not the 22-equation mass-action model of the paper). Because the effective Hill coefficient of each level is measured from its 10% and 90% response points, the compounding of the three levels can be read off directly.`,
      caption: String.raw`The three levels' response to the input (log axis), each normalised to its own maximum. Move $K_m$ (in units of the total substrate) toward 0 to put the cycles into the zero-order regime: every level steepens, and the last one the most. The right panel reports the effective Hill coefficients of the three levels. Put $K_m$ above 1 or $c$ near 1 and the cascade collapses to nearly hyperbolic curves. A dashed Hill curve with $n=1$ is shown for comparison.`,
      deps: ['mathbio-5.10'],
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
          S2.hline(1, { color: 'muted', dash: true }); S2.hline(4.5, { color: 'red', dash: true, alpha: 0.7 }); S2.text('4–5: Huang & Ferrell', 3.55, 4.75, { size: 10, color: 'red', align: 'right' });
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
whose analysis predicts that bistability needs cooperative repression ($\beta\gamma>1$) and sufficiently large and balanced synthesis rates, and showed experimentally that the circuit can be flipped between its two states by a transient chemical or thermal induction and then holds the state, with a nearly ideal switching threshold. The toggle was proposed as an addressable cellular memory unit.`,
      idea: String.raw`By 2000 multistability was known in natural switches such as the $\lambda$ lysis–lysogeny decision (4.6), but it was not known whether it could be engineered from non-specialised parts. The authors started from the model, derived the conditions for bistability (the loop-gain argument of 4.3: cooperativity and balanced promoters), and then built toggles from different promoter–repressor pairs to test them. Two inducers acting on the two repressors play the role of the pulses of 4.2. Published in the same issue as the repressilator, the paper helped found synthetic biology: a circuit designed on paper from a model, built from parts, and validated by its behaviour.`,
      caption: String.raw`**Left**: the model's phase plane for the chosen $\alpha_1,\alpha_2,\beta,\gamma$, with nullclines and steady states; the gold dot is the cell's state. Press **IPTG-like pulse** (inactivates $u$) or **heat-like pulse** (inactivates $v$) to flip the cell and watch the gold path; the state is kept after the pulse. **Right**: the design map in the $(\alpha_1,\alpha_2)$ plane for the current $\beta,\gamma$ (green: bistable; drag the white handle, or use the sliders). The map is computed from the model here; it is not digitised from the paper, and I have no parameter values from the paper, so the defaults are illustrative. With $\beta\gamma\le1$ the green region is empty.`,
      deps: ['sysbio-4.1', 'mathbio-6.6'],
      refs: [],
      tags: ['synthetic biology', 'toggle switch', 'bistability'],
      scope: String.raw`A dimensionless two-variable model; the experimental circuits used particular promoters and repressors (reported in the paper) and were read out with a fluorescent reporter in single cells and populations. The pulse model here (a rescaling of the repressor concentration) is my idealisation of the inducers, IPTG for the Lac repressor and temperature for a temperature-sensitive $\lambda$ repressor, which I recall from the paper but have not re-read.`,
      credit: 'Timothy S. Gardner, Charles R. Cantor & James J. Collins, 2000',
      links: { doi: 'https://doi.org/10.1038/35002131', wikipedia: 'https://en.wikipedia.org/wiki/Genetic_toggle_switch' },
      verify: true,
      viz(v) {
        const lb = v.slider(String.raw`$\beta$ (cooperativity of $v$ repressing $u$)`, 0.5, 4, 2, { step: 0.05 });
        const lg = v.slider(String.raw`$\gamma$ (cooperativity of $u$ repressing $v$)`, 0.5, 4, 2, { step: 0.05 });
        const a1s = v.slider(String.raw`$\alpha_1$ (synthesis of $u$)`, 1, 300, 10, { log: true, sig: 2 });
        const a2s = v.slider(String.raw`$\alpha_2$ (synthesis of $v$)`, 1, 300, 10, { log: true, sig: 2 });
        const L = v.stage({ x: [0, 11], y: [0, 11], axes: 'box', gutter: true, height: 360, weight: 1.1, minWidth: 280, xlabel: 'repressor 1  u', ylabel: 'repressor 2  v' });
        const Rg = v.stage({ x: [1, 300], xlog: true, y: [1, 300], ylog: true, axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 280, xlabel: 'α₁', ylabel: 'α₂', title: 'design map: where the toggle is bistable' });
        const hd = Rg.handle(10, 10, { color: 'ink', r: 8 });
        let st = { u: 10, v: 0.1 }, trail = [], last = '', info = null;
        const stateOf = () => (st.u > st.v ? 'u high' : 'v high');
        const pulse = (sg) => {
          const a1 = a1s.value, a2 = a2s.value, b = lb.value, g = lg.value, I = 10;
          const iu = sg > 0 ? 1 + I : 1, iv = sg < 0 ? 1 + I : 1;
          const F = (inducer) => (y) => [a1 * rep(y[1] / (inducer ? iv : 1), b) - y[0], a2 * rep(y[0] / (inducer ? iu : 1), g) - y[1]];
          const p1 = integrate(F(true), [st.u, st.v], 20, 400, 4), e1 = p1[p1.length - 1];
          const p2 = integrate(F(false), [e1[1], e1[2]], 40, 800, 8), e2 = p2[p2.length - 1];
          trail = p1.concat(p2).map((r) => [r[1], r[2]]); st = { u: e2[1], v: e2[2] };
          last = sg > 0 ? 'IPTG-like pulse' : 'heat-like pulse';
        };
        v.button('IPTG-like pulse (inactivate u)', () => pulse(1));
        v.button('heat-like pulse (inactivate v)', () => pulse(-1));
        v.button('Reset', () => { const r = toggleRoots(a1s.value, a2s.value, lb.value, lg.value).filter((q) => q.stable); const q = r.length ? r.reduce((p, w) => (p.u > w.u ? p : w)) : { u: 10, v: 0 }; st = { u: q.u, v: q.v }; trail = []; last = ''; });
        let syncing = false;
        v.render(() => {
          const A1 = a1s.value, A2 = a2s.value, b = lb.value, g = lg.value;
          // keep the handle and the sliders in step
          if (!syncing && (Math.abs(Math.log(hd.x / A1)) > 1e-6 || Math.abs(Math.log(hd.y / A2)) > 1e-6)) {
            if (hd.dragging) { syncing = true; a1s.set(Math.min(300, Math.max(1, hd.x))); a2s.set(Math.min(300, Math.max(1, hd.y))); syncing = false; } else hd.set(A1, A2);
          }
          const m = 1.12 * Math.max(A1, A2, 2); L.setView([0, m], [0, m]);
          L.fn((x) => A2 * rep(x, g), { color: 'purple', width: 2.2 });
          L.curve((y) => [A1 * rep(y, b), y], 0, m, { color: 'orange', width: 2.2, n: 300 });
          const roots = toggleRoots(A1, A2, b, g);
          roots.forEach((r) => L.dot(r.u, r.v, { r: 6, color: r.stable ? 'green' : 'red', hollow: !r.stable }));
          if (trail.length) L.path(trail, { color: 'gold', width: 2 });
          L.dot(st.u, st.v, { r: 7, color: 'gold' });
          Rg.raster((x, y) => (toggleRoots(x, y, b, g, 0, 160).filter((r) => r.stable).length >= 2 ? [...v.rgb('green').slice(0, 3), 90] : null), { res: 4, key: `${b}|${g}` });
          info = { k: roots.length, s: roots.filter((r) => r.stable).length, bg: b * g };
        });
        v.legend([['orange', 'u-nullcline'], ['purple', 'v-nullcline'], ['gold', 'cell state', { dot: true }]]);
        v.readout(() => (info ? `$\\beta\\gamma=${v.fix(info.bg, 2)}$ — paper's condition for bistability: $\\beta\\gamma>1$ (${info.bg > 1 ? 'met' : 'not met'}); this circuit: ${info.k} steady state${info.k === 1 ? '' : 's'}, ${info.s} stable → **${info.s >= 2 ? 'bistable' : 'monostable'}**\nstate now: **${stateOf()}**${last ? ` (after the last ${last})` : ''}` : ''));
      },
    },
  ],
};
