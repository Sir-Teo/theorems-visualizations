// Ecology — Chapter 4 (part b): limiting similarity to the competition–colonization trade-off
import { jcInit, jcRichness, spcol } from './ch04.shared.js';

import { forestStep, parentSeed, parentSurvival, parentRecruitment, parentRecruitmentPeak } from './ecol-source-audit-forest.shared.js';

import { lotteryGrowth, lotteryStepLogOdds, lotteryShare, lotteryOutcome, wedgeOutcome } from './ecol-source-audit-lottery.shared.js';

import { packingUtil as packingU, packingMatrix, packingCondition, packingSolve } from './ecol-source-audit-packing.shared.js';

import { runDisplacement, displacementLimit } from './ecol-source-audit-displacement.shared.js';

import { colonizationEquilibrium, colonizationCoexistence, runColonization } from './ecol-source-audit-colonization.shared.js';

export default {
  collection: 'ecol',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Concept',
      name: 'Limiting similarity',
      credit: 'R. H. MacArthur & R. Levins, 1967; finite packing sensitivity experiment derived here',
      statement: String.raw`In a resource-overlap Lotka–Volterra model, choose competition coefficients $\alpha_{ij}=\int u_i u_j/\int u_i^2$ for congruent utilization curves at distinct regularly spaced optima. A strictly positive equilibrium requires $N^*=\alpha^{-1}K>0$. Limiting similarity concerns restrictions on packing compatible with this coexistence; no universal minimum spacing follows from overlap alone. Finite array boundaries, curve shape and differences among constant carrying capacities can all change feasibility, even when a positive equilibrium would be locally stable.`,
      scope: String.raw`The overlap prescription is a model assumption, justified heuristically for rapidly renewed resources or spatial encounters, not an identity for every ecological interaction. Here Kᵢ are drawn once and then held constant: the noise slider controls between-species variation, not temporal environmental variation. All widths are chosen scale parameters: Gaussian w is its standard deviation, exponential w its decay length, and box w its half-width. The atlas finite-array/lognormal Monte Carlo experiment is not a reproduction of an original figure or a stochastic-persistence theorem.`,
      idea: String.raw`An overlap matrix is generally positive semidefinite. For the three displayed kernels, finitely many distinct translates are linearly independent, making this equal-norm Gram matrix strictly positive definite in exact arithmetic. At a positive equilibrium the Jacobian is $-D\alpha$, for positive diagonal $D$, and is similar to the negative-definite symmetric matrix $-D^{1/2}\alpha D^{1/2}$: this proves local stability. Positivity of $\alpha^{-1}K$ is a separate requirement; a negative formal abundance means this full-species equilibrium is infeasible, not that the negative species alone determines the surviving community. Very small spacing makes the solve ill-conditioned, so numerical uncertainty must not be counted as ecological exclusion.`,
      caption: String.raw`Top: n equally spaced utilization curves, with chosen width parameter w=1. Bottom left: the formal equilibrium for one fixed draw of Kᵢ, when numerically resolved. Bottom right: resolved-feasible fraction among 150 fixed lognormal draws versus spacing; gray shows unresolved fraction. Gold marks the chosen spacing; its readout is calculated at that exact spacing. Neither curve is a universal probability of coexistence, and finite sampling need not give a monotone transition.`,
      deps: ['mathbio-3.21'],
      refs: ['MacArthur & Levins (1967), Am.Nat.101:377–385, pp.377–381 equations1–3 and overlap derivation; finite-array numerical experiment derived here'],
      tags: ['niche', 'competition', 'species packing'],
      links: { doi: 'https://doi.org/10.1086/282505' },
      verify: false,
      viz(v) {
        const nS = v.slider('number of species $n$', 3, 9, 5, { int: true });
        const dS = v.slider('spacing $d/w$', 0.2, 3.5, 1, { step: 0.05 });
        const sS = v.slider('noise in carrying capacities (s.d. of $\\ln K$)', 0, 0.4, 0.1, { step: 0.01 });
        const kern = v.select('utilization curves', [{ value: 'g', label: 'Gaussian' }, { value: 'l', label: 'exponential' }, { value: 'b', label: 'box' }], 'g');
        const util=packingU;
        const A = v.stage({ x: [-6, 6], y: [0, 1.25], axes: 'box', gutter: true, height: 230, xlabel: 'position on the resource axis (units of $w$)', title: 'utilization curves', full: true });
        const B = v.stage({ x: [0, 10], y: [-1, 2], axes: 'box', gutter: true, height: 270, xlabel: 'species', ylabel: 'equilibrium $N_i^*$', title: 'equilibrium abundances', weight: 1 });
        const C = v.stage({ x: [0, 3.5], y: [0, 1.05], axes: 'box', gutter: true, height: 270, xlabel: 'spacing $d/w$', ylabel: 'fraction of draws feasible', title: 'finite draw feasibility and numerical uncertainty', weight: 1 });
        let mcKey = '', mc = [], un = [], info = null;
        v.render(() => {
          const n = nS.value, dw = dS.value, sd = sS.value, k = kern.value;
          const half = Math.max(3, ((n - 1) * dw) / 2 + 2.5);
          A.setView([-half, half], [0, 1.25]);
          const xs = Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * dw);
          xs.forEach((x0, i) => A.fn((x) => util(k, x - x0), { color: spcol(i), width: 2, fill: true, fillAlpha: 0.1, domain: [x0 - 5, x0 + 5], n: 300 }));
          const r = v.rng(31), z = [];
          const NT = 150;
          for (let t = 0; t < NT; t++) { z.push([]); for (let i = 0; i < n; i++) z[t].push(r.normal()); }
          const key = [n, sd, k].join('|');
          if (key !== mcKey) {
            mcKey = key; mc = []; un=[];
            for (let q = 0; q <= 35; q++) {
              const d=.1+3.4*q/35,M=packingMatrix(k,n,d),cond=packingCondition(M);let ok=0,unknown=0;
              for(let t=0;t<NT;t++){const r=packingSolve(M,z[t].map(e=>Math.exp(sd*e)),cond);if(r.status==='feasible')ok++;if(r.status==='unresolved')unknown++;}
              mc.push([d,ok/NT]);un.push([d,unknown/NT]);
            }
          }
          const Kv = z[0].map(() => 1).map((one, i) => Math.exp(sd * z[0][i]));
          const M=packingMatrix(k,n,dw),cond=packingCondition(M),result=packingSolve(M,Kv,cond),Ns=result.status==='unresolved'?null:result.x;let ok=0,unknown=0;for(const row of z){const r=packingSolve(M,row.map(e=>Math.exp(sd*e)),cond);if(r.status==='feasible')ok++;if(r.status==='unresolved')unknown++;}
          B.setView([0, n + 1], [Math.min(-0.5, ...(Ns || [0]).map((u) => u * 1.1)), Math.max(2, ...(Ns || [0]).map((u) => u * 1.1))]);
          if (Ns) B.bars(Ns, { x0: 1, dx: 1, color: (u) => (u > 0 ? 'green' : 'red') });
          B.hline(0, { color: 'ink', width: 1 });
          C.path(mc, { color: 'accent', width: 2.6 });C.path(un,{color:'muted',width:1.8,dash:[4,3]});
          C.vline(dw, { color: 'gold', width: 2 });
          info={status:result.status,cond,minN:Ns?Math.min(...Ns):null,p:ok/NT,u:unknown/NT};
        });
        v.legend([['accent','resolved-feasible fraction'],['muted','numerically unresolved fraction',{dash:true}],['gold','selected spacing']]);
        v.readout(() => info && `Exact selected spacing: resolved-feasible ${v.fix(info.p,2)}, unresolved ${v.fix(info.u,2)} among 150 draws. For this fixed draw: **${info.status==='feasible'?'positive equilibrium, locally stable':info.status==='infeasible'?'formal full-species equilibrium infeasible':'numerically unresolved; no ecological exclusion conclusion'}**.${info.minN===null?'':` Smallest formal abundance ${v.fix(info.minN,3)}.`} Estimated infinity-norm condition ${Number.isFinite(info.cond)?info.cond.toExponential(2):'beyond the solver threshold'}. Exact Gram positive definiteness is not established by a rounded numerical eigenvalue.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Phenomenon',
      name: 'Character displacement',
      credit: 'P. R. Grant & B. R. Grant, 2006 (field evidence); symmetric trait model derived here',
      statement: String.raw`Ecological character displacement is evolutionary divergence in resource-use traits caused by interspecific competition. Larger differences between sympatric than allopatric populations can be consistent with this mechanism, but the pattern alone does not establish its cause. Grant & Grant followed *Geospiza fortis* on Daphne Major after *G. magnirostris* established a breeding population in 1982: during the 2004–2005 drought, selection favored smaller beaks in *G. fortis*, away from the larger competitor. The next generation’s change was consistent with the response predicted from heritability and measured selection.`,
      scope: String.raw`The field paper offers four lines of observational support for competition and calls for replicated experiments to establish causation definitively. Its 2005 offspring generation was measured in 2006; these dates are not interchangeable. The visualization is an atlas illustration with chosen standardized traits, not empirical finch trajectories or fitted evolutionary rates. It imposes exact symmetry, equal growth parameters, positive ecological equilibria, instantaneous ecological equilibration and a constant response coefficient; stochasticity, genetic variance changes and demographic extinction are absent.`,
      idea: String.raw`For resident traits $z_1=-z$, $z_2=z$, choose $K(z)=e^{-z^2/(2\sigma_K^2)}$ and $\alpha(d)=e^{-d^2/(2\sigma_a^2)}$. The symmetric Lotka–Volterra equilibrium is $N_1=N_2=K(z)/(1+\alpha(2z))>0$ for $z>0$. Differentiating a rare mutant’s per-capita fitness with resident densities held fixed gives $$\dot z=\tfrac14 z\left[\frac{2\alpha(2z)}{\sigma_a^2(1+\alpha(2z))}-\frac1{\sigma_K^2}\right].$$ Allopatry instead has $\dot z=-z/(4\sigma_K^2)$. A positive separation equilibrium exists only for $\sigma_a<\sigma_K$, with $d^*=\sigma_a\sqrt{2\ln(2\sigma_K^2/\sigma_a^2-1)}$; otherwise separation tends to zero. As traits coincide, ecological splitting becomes neutral; the exact coincident limit is not a stable distinct-species coexistence claim.`,
      caption: String.raw`Left: chosen resource curve K(z) and schematic trait distributions (fixed display width, not measured variation). Right: symmetric mean traits through 40 chosen evolution-time units in sympatry (solid) and exact allopatric relaxation (dashed). Press play or change the competition and resource widths. Narrower competition than the resource curve can maintain divergence; increasing the competition width beyond the resource width removes the positive-separation equilibrium. Finite trajectories need not have reached their limits.`,
      deps: ['ecol-4.7'],
      refs: ['Grant & Grant (2006), Science 313:224–226, full paper; displayed fitness-gradient and separation limit derived explicitly here'],
      tags: ['evolution', 'competition', 'trait'],
      links: { doi: 'https://doi.org/10.1126/science.1128374' },
      verify: false,
      viz(v) {
        const sa = v.slider('width of competition $\\sigma_a$', 0.2, 1.5, 0.6, { step: 0.05 });
        const sk = v.slider('breadth of resources $\\sigma_K$', 0.3, 2, 1, { step: 0.05 });
        const T = 40;
        let key = '', sym = null, allo = null, prog = 1, info = null;
        const A = v.stage({ x: [-3, 3], y: [0, 1.4], axes: 'box', gutter: true, height: 320, xlabel: 'trait $z$ (e.g. beak depth, standardized)', ylabel: 'resource availability $K(z)$', title: 'resources and the two species', weight: 1 });
        const B = v.stage({ x: [0, T], y: [-2, 2], axes: 'box', gutter: true, height: 320, xlabel: 'chosen evolution time', ylabel: 'mean trait', title: 'evolution of the two trait means', weight: 1 });
        v.render(() => {
          const kk = sa.value + '|' + sk.value;
          if (kk !== key) { key = kk; sym = runDisplacement(sa.value,sk.value); allo = {z1:sym.allo1,z2:sym.allo2}; }
          const k = sk.value, n = sym.t.length - 1, idx = Math.min(n, Math.floor(prog * n));
          A.fn((z) => Math.exp(-z * z / (2 * k * k)), { color: 'muted', width: 2, fill: true, fillAlpha: 0.08, domain: [-3, 3] });
          const bump = (m, col) => A.fn((z) => 0.7 * Math.exp(-((z - m) ** 2) / (2 * 0.15 * 0.15)), { color: col, width: 2.4, fill: true, fillAlpha: 0.3, domain: [-3, 3], n: 300 });
          A.dot(-0.15, 0.04, { r: 3, color: 'accent' }); A.dot(0.15, 0.04, { r: 3, color: 'orange' });
          bump(sym.z1[idx], 'accent'); bump(sym.z2[idx], 'orange');
          const m = Math.max(1, ...sym.z1.map(Math.abs), ...sym.z2.map(Math.abs)) * 1.1;
          B.setView([0, T], [-m, m]);
          const sl = (arr) => sym.t.slice(0, idx + 1).map((t, i) => [t, arr[i]]);
          B.path(sl(allo.z1), { color: 'accent', width: 1.6, dash: [5, 4] }); B.path(sl(allo.z2), { color: 'orange', width: 1.6, dash: [5, 4] });
          B.path(sl(sym.z1), { color: 'accent', width: 2.6 }); B.path(sl(sym.z2), { color: 'orange', width: 2.6 });
          info = { ds: Math.abs(sym.z2[idx] - sym.z1[idx]), da: Math.abs(allo.z2[idx] - allo.z1[idx]), limit: displacementLimit(sa.value,sk.value), t: sym.t[idx] };
        });
        v.animate((t) => { prog = Math.min(1, t / 10); v.invalidate(); }, { period: 12, still: 11.9 });
        v.legend([['accent', 'species 1'], ['orange', 'species 2'], ['muted', 'resource curve'], ['ink', 'solid: sympatry, dashed: allopatry']]);
        v.readout(() => info && String.raw`At chosen time ${v.fix(info.t,1)}: separation **${v.fix(info.ds,3)}** in sympatry versus ${v.fix(info.da,3)} in allopatry. Symmetric-model limiting separation: ${v.fix(info.limit,3)}. ${sa.value>=sk.value?'No positive-separation equilibrium: finite separation decays toward zero; ecological splitting is neutral at exact coincidence.':'The positive-separation equilibrium is an illustrative model result, not a fit to the field data.'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Concept',
      name: 'Stabilizing versus equalizing mechanisms (Chesson)',
      credit: 'P. Chesson, 2000',
      statement: String.raw`In modern coexistence theory two species can coexist when each can increase from low density in the presence of the other. For the two-species Lotka–Volterra competition model this reduces to $$\rho<\frac{\kappa_1}{\kappa_2}<\frac1\rho ,$$ where $\rho=\sqrt{\alpha_{12}\alpha_{21}}$ is the **niche overlap** and $\kappa_1/\kappa_2$ is the **fitness ratio** (here $\kappa_1/\kappa_2=\frac{K_1}{K_2}\sqrt{\alpha_{21}/\alpha_{12}}$). **Stabilizing mechanisms** reduce $\rho$ (they make species limit themselves more than each other) and so widen the coexistence region. **Equalizing mechanisms** bring the fitness ratio toward 1. For $\rho>1$ the coexistence inequality has no solution; priority effects occur only when $1/\rho<\kappa_1/\kappa_2<\rho$. Outside that reversed wedge one species excludes the other; equality is an invasion boundary.`,
      scope: String.raw`Exact for two-species Lotka–Volterra competition. Chesson’s general framework defines the stabilizing and equalizing components through invasion growth rates for arbitrary models, using the same wedge picture.`,
      idea: String.raw`Species 1 can invade a resident of species 2 at its carrying capacity when $K_1/K_2>\alpha_{12}$, and species 2 can invade species 1 when $K_1/K_2<1/\alpha_{21}$. Dividing out the asymmetry between $\alpha_{12}$ and $\alpha_{21}$ and writing the conditions in terms of $\rho$ and $\kappa_1/\kappa_2$ gives the symmetric wedge above. Stronger competition within species than between (small $\rho$) makes the wedge wide; unequal fitness moves the point off the centre line, and only equalizing mechanisms bring it back (compare the four outcomes of mathbio-3.16).`,
      caption: String.raw`Drag the gold point in the plane of niche overlap $\rho$ (horizontal) and fitness ratio (vertical, log scale). The green wedge is where both species can invade; above it species 1 excludes 2, below it species 2 excludes 1, and for $\rho>1$ the reversed wedge (red) is the region of priority effects. The right panel integrates the Lotka–Volterra equations at the chosen point. The buttons apply a **stabilizing** change (overlap $\times0.7$) or an **equalizing** change (fitness ratio $\to$ its square root).`,
      deps: ['mathbio-3.16'],
      refs: ['Begon ch. 19'],
      tags: ['coexistence theory', 'niche overlap', 'Chesson'],
      links: { doi: 'https://doi.org/10.1146/annurev.ecolsys.31.1.343' },
      viz(v) {
        const A = v.stage({ x: [0, 1.25], y: [0.2, 5], ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'niche overlap $\\rho$ (stabilization = $1-\\rho$)', ylabel: 'fitness ratio $\\kappa_1/\\kappa_2$', title: 'coexistence wedge', weight: 1 });
        const B = v.stage({ x: [0, 60], y: [0, 160], axes: 'box', gutter: true, height: 340, xlabel: 'time', ylabel: 'abundance', title: 'Lotka–Volterra dynamics at the point', weight: 1 });
        const h = A.handle(0.5, 1.6, { color: 'gold', r: 9, label: 'pair', constrain: { x: [0.02, 1.22], y: [0.21, 4.9] } });
        const start = v.select('who starts ahead', [{ value: 'e', label: 'neither' }, { value: '1', label: 'species 1' }, { value: '2', label: 'species 2' }], 'e');
        v.button('apply a stabilizing mechanism', () => { h.set(Math.max(0.02, h.x * 0.7), h.y); });
        v.button('apply an equalizing mechanism', () => { h.set(h.x, Math.exp(Math.log(h.y) * 0.5)); });
        v.button('neutral reference',()=>h.set(1,1));
        v.button('zero-invasion reference',()=>h.set(.5,.5));
        let info = null;
        v.render(() => {
          const rho = h.x, kap = h.y;
          const xs = Array.from({ length: 101 }, (_, i) => (1.25 * i) / 100);
          A.between((x) => (x < 1 ? x : 1), (x) => (x < 1 ? 1 / Math.max(x, 0.01) : 1), 0, 1, { fill: 'green', fillAlpha: 0.22 });
          A.between((x) => 1 / x, (x) => x, 1, 1.25, { fill: 'red', fillAlpha: 0.22 });
          A.fn((x) => x, { color: 'green', width: 2, domain: [0.01, 1.25] });
          A.fn((x) => 1 / x, { color: 'green', width: 2, domain: [0.01, 1.25] });
          A.vline(1, { color: 'muted', width: 1.2, dash: true });
          A.hline(1, { color: 'muted', width: 1, dash: true });
          A.text('coexistence', 0.27, 1.0, { color: 'green', size: 13 });
          A.text('species 1 excludes 2', 0.35, 3.3, { color: 'accent', size: 12 });
          A.text('species 2 excludes 1', 0.35, 0.3, { color: 'orange', size: 12 });
          A.text('priority effects', 1.24, 0.62, { color: 'red', size: 11, align: 'right' });
          // Lotka–Volterra with alpha12 = alpha21 = rho, K2 = 100, K1 = 100 kappa
          const K1 = 100 * kap, K2 = 100;
          let n1 = start.value === '1' ? 30 : 10, n2 = start.value === '2' ? 30 : 10;
          const pa = [[0, n1]], pb = [[0, n2]], dt = 0.05;
          for (let s = 1; s <= 60 / dt; s++) {
            const f = (a, b) => [a * (1 - (a + rho * b) / K1), b * (1 - (b + rho * a) / K2)];
            const k1 = f(n1, n2), k2 = f(n1 + 0.5 * dt * k1[0], n2 + 0.5 * dt * k1[1]), k3 = f(n1 + 0.5 * dt * k2[0], n2 + 0.5 * dt * k2[1]), k4 = f(n1 + dt * k3[0], n2 + dt * k3[1]);
            n1 = Math.max(0, n1 + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]));
            n2 = Math.max(0, n2 + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]));
            if (s % 10 === 0) { pa.push([s * dt, n1]); pb.push([s * dt, n2]); }
          }
          B.setView([0, 60], [0, Math.max(120, K1 * 1.1, K2 * 1.1)]);
          B.path(pa, { color: 'accent', width: 2.6 }); B.path(pb, { color: 'orange', width: 2.6 });
          const inside = rho < 1 && kap > rho && kap < 1 / rho;
          info = {rho,kap,inside,n1,n2,outcome:wedgeOutcome(rho,kap)};
        });
        v.legend([['accent', 'species 1'], ['orange', 'species 2'], ['green', 'coexistence boundary']]);
        v.readout(() => info && String.raw`$\rho=${v.fix(info.rho,2)}$, $\kappa_1/\kappa_2=${v.fix(info.kap,2)}$: **${info.outcome}**. ${info.outcome==='priority effects'?'Within the reversed wedge both invasion rates are negative, so the attraction basin matters.':info.outcome==='neutral continuum'?'At rho=fitness=1, the total tends to 100 while the starting proportion stays constant.':info.outcome==='zero-invasion boundary'?'A zero invasion rate needs boundary analysis; strict coexistence/priority inequalities do not apply.':''} At finite t=60: $N_1=${v.fix(info.n1,1)}$, $N_2=${v.fix(info.n2,1)}$.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Model',
      name: 'Lottery model and the storage effect',
      credit: 'P. L. Chesson & R. R. Warner, 1981',
      statement: String.raw`In the two-species lottery model, adults hold sites and a common fixed fraction $0<\delta\le1$ dies per year. Juveniles refill every vacancy in proportion to their positive recruitment successes: $$p_i(t+1)=(1-\delta)p_i+\delta\frac{B_i(t)p_i}{\sum_j B_j(t)p_j}.$$ Here yearly log recruitment vectors are independent and identically distributed, with each species’ standard deviation σ, correlation ρ and mean difference Δμ. Invasion growth rates are $g_1=E\ln(1-\delta+\delta e^X)$ and $g_2=E\ln(1-\delta+\delta e^{-X})$, where $X\sim N(\Delta\mu,2\sigma^2(1-\rho))$. Strictly positive rates for both are the mutual-invasion condition for the reported stochastic coexistence. It concerns probability distributions, not a positive lower bound on every infinite sample path.`,
      scope: String.raw`An effectively infinite number of sites, both species initially present, positive fecundities, equal constant adult mortality, complete vacancy filling and no demographic stochasticity. The displayed common-mortality lognormal specialization omits the original paper’s unequal and random death-rate cases. Its invasion formula is exact; plotted Gaussian integration is a numerical approximation with analytic special cases and a 1e−8 sign-resolution threshold. The 1981 paper gives a heuristic coexistence argument and refers full stochastic persistence proofs elsewhere; this display is not that proof.`,
      idea: String.raw`The finite multiplicative growth at rarity is 1−δ+δ exp(X). Survivorship buffers bad years for δ<1. For small Δμ and small variance V=2σ²(1−ρ), expanding around X=0 gives $g_1=\delta\Delta\mu+\tfrac12\delta(1-\delta)(V+\Delta\mu^2)+\text{higher orders}$; reversing Δμ gives g₂. This is a local expansion, not a global coexistence threshold. When δ=1, g₁=Δμ and g₂=−Δμ exactly. With Δμ=0 and positive V this unbuffered log-odds process is a zero-drift random walk, not stable coexistence. With no relative variation (σ=0 or ρ=1) and Δμ=0 the proportions are exactly neutral and constant.`,
      caption: String.raw`Right: numerically resolved mutual-invasion region for the chosen mean log-recruitment difference and correlation; drag the gold point. Left: six finite, seeded 400-year histories from 50:50. Paths are integrated in log odds so a rounded displayed share of zero or one does not create a false absorbing extinction. When σ=0 or ρ=1 a nonzero mean difference favors one species, but zero difference gives neutral constant shares. At δ=1 there is no buffered coexistence; zero mean relative growth instead gives unbuffered drift. Finite wandering paths do not establish persistence.`,
      deps: ['ecol-4.9'],
      refs: ['Chesson & Warner (1981), Am.Nat.117:923–943; model equations3–4 p926, equation11 p928, invasion rates p929, stochastic-persistence meaning pp933–935, Appendix pp940–942'],
      tags: ['storage effect', 'lottery', 'variability'],
      links: { doi: 'https://doi.org/10.1086/283778', wikipedia: 'https://en.wikipedia.org/wiki/Storage_effect' },
      verify: false,
      viz(v) {
        const dm = v.slider('difference in mean log recruitment $\\Delta\\mu$', 0, 0.5, 0.1, { step: 0.01 });
        const rc = v.slider('correlation of the two species’ good years', -0.5, 1, 0, { step: 0.05 });
        const A = v.stage({ x: [0, 400], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'year', ylabel: 'share of sites held by species 1', title: 'six simulated histories', weight: 1 });
        const B = v.stage({ x: [0, 1.5], y: [0.02, 1], axes: 'box', gutter: true, height: 330, xlabel: 'strength of fluctuations $\\sigma$', ylabel: 'adult death rate $\\delta$', title: 'both species can invade', weight: 1 });
        const h = B.handle(0.8, 0.3, { color: 'gold', r: 9, label: '(σ, δ)', constrain: { x: [0, 1.5], y: [0.02, 1] } });
        // invasion growth rate of the rare species whose mean log-ratio is +m: E ln(1 - d + d e^X), X ~ N(m, 2 s^2 (1 - rho))
        const gr=lotteryGrowth;
        let info = null;
        v.render(() => {
          const m = dm.value, rho = rc.value, s = h.x, d = h.y;
          const key=[m,rho,v.rgb('green').join(',')].join('|');
          B.raster((x, y) => { const g = Math.min(gr(m, x, y, rho), gr(-m, x, y, rho)); return g > 1e-8 ? v.rgb('green').slice(0, 3).concat([0.45]) : null; }, { key, res: 6 });
          B.axes();B.hline(1,{color:'muted',width:2,dash:[4,3]});
          const r = v.rng(5);
          for (let q = 0; q < 6; q++) {
            let logOdds=0;const pts=[[0,.5]];
            for (let t = 1; t <= 400; t++) {
              const z1 = r.normal(), z2 = rho * z1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * r.normal();
              const x=m+s*(z1-z2);
              logOdds=lotteryStepLogOdds(logOdds,x,d);
              if(t%2===0)pts.push([t,lotteryShare(logOdds)]);
            }
            A.path(pts, { color: spcol(q), width: 1.6, alpha: 0.9 });
          }
          A.hline(0.5, { color: 'grid' });
          const g1 = gr(m, s, d, rho), g2 = gr(-m, s, d, rho);
          info = { g1, g2, s, d, outcome:lotteryOutcome(m,s,d,rho) };
        });
        v.legend([['green','resolved mutual-invasion region'],['muted','δ=1: unbuffered boundary',{dash:true}]]);
        v.readout(() => info && String.raw`At $\sigma=${v.fix(info.s,2)}$, $\delta=${v.fix(info.d,2)}$: numerical invasion growth per year ${v.fix(info.g1,6)} and ${v.fix(info.g2,6)} → **${info.outcome}**. Gaussian integral is approximated; signs within 1e−8 are unresolved. Finite sample paths are illustrations, not a stochastic-persistence proof.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.11
    {
      num: '4.11',
      kind: 'Hypothesis',
      name: 'Janzen–Connell hypothesis',
      credit: 'D. H. Janzen, 1970 (original hypothesis reviewed); conventional Janzen–Connell name',
      statement: String.raw`The Janzen–Connell hypothesis proposes that host-specific natural enemies can reduce seed and seedling survival near conspecific adults or dense conspecific juveniles, limiting local dominance and creating recruitment opportunities for other species. Seed rain often decreases with distance from the parent while survival from these enemies can increase; their product may peak away from the parent. This is a proposed coexistence mechanism, not a universal rule that every species has an off-parent peak or that every enemy increases total diversity.`,
      scope: String.raw`Janzen’s original paper distinguishes distance-responsive and density-responsive enemies and labels its curves schematic. Its diversity argument requires other species and seed sources to be available. The lattice below is an atlas illustration, not a fitted tropical-forest census or the original paper’s model. It has 900 sites on a periodic 30×30 lattice, 20 initial labels, 10% independent mortality per update, local seed dispersal and a conspecific crowding penalty. Pre-mortality adults supply the current update’s seed bank; recruits cannot reproduce again within that update. There is no immigration or speciation: lost labels cannot return, and this finite model cannot establish permanent coexistence. Both forests use the same random stream; identical gamma=0 rules then give identical paths.`,
      idea: String.raw`For each vacancy the chosen model draws a species with weight (local seed rain)×exp(−γ×local conspecific crowding). Increasing crowding lowers a species’ recruitment weight relative to others, providing a possible negative-frequency feedback, but finite richness need not increase monotonically with γ or in every random run. The separate single-parent cartoon uses per-unit-area seed density I(d)=exp(−d/2) and survival P(d)=exp(−γ exp(−(d/2.5)²)); recruitment is their product. This is not the total number in a radial annulus (which would include an area factor). We compare the parent limit d=0 with any interior maximum; weak enemy effects can still leave the global peak at 0.`,
      caption: String.raw`Two identically initialized forests compare neutral recruitment (left) with the selected conspecific-enemy penalty (middle), using paired random numbers. Right: richness over 400 chosen updates, and a schematic single-parent seed-density×survival profile per unit area, with recruitment rescaled to peak1. The displayed species counts are finite realizations, not field observations or a diversity theorem. Set γ=0 to recover exactly identical forest paths; positive γ need not move the single-parent peak away from0.`,
      deps: ['ecol-4.9'],
      refs: ['Janzen (1970), Am.Nat.104:501–528, original text pp501–504, Figure1 p502, distance/density distinctions pp504–514, recruitment surfaces pp514–516, discussion/summary pp520–525'],
      tags: ['negative density dependence', 'forest', 'diversity'],
      links: { doi: 'https://doi.org/10.1086/282687', wikipedia: 'https://en.wikipedia.org/wiki/Janzen%E2%80%93Connell_hypothesis' },
      verify: false,
      viz(v) {
        const L = 30, S = 20, G = 400;
        const gS = v.slider('enemy effect strength $\\gamma$', 0, 4, 2.5, { step: 0.1, onChange: () => { sim.reset(); } });
        const pal = Array.from({ length: S }, (_, i) => v.M.hsl2rgb((i * 0.381966) % 1, 0.65, 0.55));
        const init = () => {
          const mk = (gamma) => { const st = jcInit(L, S, v.rng(9)); st.gamma = gamma; st.hist = [jcRichness(st)]; st.rng = v.rng(100); return st; };
          const a = mk(0), b = mk(gS.value); b.g.set(a.g);
          return { a, b };
        };
        const step = (st) => { for (const f of [st.a, st.b]) { forestStep(f, { gamma: f.gamma }); f.hist.push(jcRichness(f)); } };
        const sim = v.sim(init, step, { dt: 1, maxSteps: G });
        const A = v.stage({ x: [0, L], y: [0, L], equal: true, axes: false, height: 280, title: 'neutral forest (no enemies)', weight: 1 });
        const Bs = v.stage({ x: [0, L], y: [0, L], equal: true, axes: false, height: 280, title: 'Janzen–Connell forest', weight: 1 });
        const C = v.stage({ x: [0, G], y: [0, S + 1], axes: 'box', gutter: true, height: 280, xlabel: 'chosen update', ylabel: 'species present', title: 'species richness', weight: 1 });
        const D = v.stage({ x: [0, 12], y: [0, 1.1], axes: 'box', gutter: true, height: 280, xlabel: 'distance from the parent tree', ylabel: 'relative value', title: 'seeds × survival = recruitment', weight: 1 });
        let info = null;
        v.animate((t) => {
          sim.advance(Math.floor(t * 20));
          const { a, b } = sim.state;
          const img = (st) => (x, y) => { const i = Math.floor(x), j = Math.floor(L - y); if (i < 0 || i >= L || j < 0 || j >= L) return null; return pal[st.g[j * L + i]]; };
          A.raster(img(a), { key: 'a' + a.gen, res: 1, id: 'a' }); Bs.raster(img(b), { key: 'b' + b.gen + '|' + b.gamma, res: 1, id: 'b' });
          C.path(a.hist.map((r, i) => [i, r]), { color: 'muted', width: 2.4 });
          C.path(b.hist.map((r, i) => [i, r]), { color: 'green', width: 2.6 });
          const g=gS.value,seed=parentSeed,surv=d=>parentSurvival(d,g),rec=d=>parentRecruitment(d,g),dpk=parentRecruitmentPeak(g),dm=rec(dpk);
          D.fn(seed,{color:'orange',width:2,domain:[0,12]});D.fn(surv,{color:'green',width:2,domain:[0,12]});D.fn(d=>rec(d)/dm,{color:'accent',width:2.8,domain:[0,12]});D.dot(dpk,1,{r:4,color:'accent'});
          info = { ra: a.hist[a.hist.length - 1], rb: b.hist[b.hist.length - 1], gen: a.gen, dpk };
        }, { period: 20, still: 19.9 });
        v.legend([['muted', 'richness, neutral'], ['green', 'richness, with enemies'], ['orange', 'seed density'], ['green', 'survival'], ['accent', 'recruitment (scaled)']]);
        v.readout(() => info && String.raw`Chosen update ${info.gen}: **${info.ra}** species left without enemies, **${info.rb}** with them. Recruitment around a single parent peaks at distance $${v.fix(info.dpk, 1)}$ cells${info.dpk===0?' (the global maximum remains at the parent limit; an off-parent peak is not guaranteed)':''}.`);
      },
    },
    // ───────────────────────────────────────────────────────────── 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Competition–colonization trade-off',
      credit: 'Tilman (1994), two-species hierarchy; permanent-habitat-loss extension derived here',
      statement: String.raw`Let species 1 be a superior competitor (it can take over a patch occupied by species 2) but a poor colonizer, and species 2 an inferior competitor but a good colonizer. With a fraction $D$ of patches destroyed, a common mortality rate $m$ and colonization rates $c_1<c_2$, the occupied fractions obey $$\dot p_1=c_1p_1(1-D-p_1)-mp_1,\qquad \dot p_2=c_2p_2(1-D-p_1-p_2)-mp_2-c_1p_1p_2 .$$ Both species persist, $p_1^*=1-D-\dfrac m{c_1}$ and $p_2^*=\dfrac m{c_1}-\dfrac{c_1}{c_2}(1-D)$, when $1-\dfrac{c_2m}{c_1^2}<D<1-\dfrac m{c_1}$, intersected with the physical range $0\le D\le1$. Both species must initially be present (or introduced). With $c_1>m$ and $c_2>c_1$, the superior competitor’s threshold $1-m/c_1$ is below the inferior competitor’s single-species threshold $1-m/c_2$; the inferior may nevertheless be excluded at low destruction.`,
      scope: String.raw`The original Tilman 1994 paper’s two-rank model has D=0; replacing available habitat 1 by H=1−D is the atlas’s stated extension, not an attribution of the habitat-destruction analysis to that paper. Fractions are relative to the entire original landscape, and propagules disperse randomly to all sites, including wasted arrivals on destroyed sites. A superior arrival instantly displaces an inferior occupant; lower-ranked species cannot harm higher ranks. Common positive mortality, positive finite colonization rates and initially feasible occupancies are assumed. Controls also allow c₂≤c₁ to test failure of the trade-off; in that case the claimed coexistence interval is empty. Finite 300-unit trajectories can remain far from equilibrium near zero-growth boundaries.`,
      idea: String.raw`Each species is an instance of the Levins model on the sites its superiors leave open. The inferior competitor survives by colonizing sites faster than the superior competitor can overtake them; the superior competitor is held at $p_1^*$, the amount of habitat it alone can fill. Habitat destruction takes away the sites that the superior competitor must fill (for positive initial occupancy it persists only while $1-D>m/c_1$), whereas the fast colonizer can live on the sites that are still free: the species that needs the most habitat, and is the best competitor, is lost first.`,
      caption: String.raw`Left: equilibrium occupancy of the superior (blue) and inferior (orange) competitor as a function of habitat destruction $D$; drag the gold point to choose $D$. Right: the time course of $p_1$, $p_2$ from a small physically feasible start at the chosen $D$ (chosen rates, not fitted data). For c₂>c₁ and c₁>m, increase $D$ until the blue equilibrium hits zero: the better competitor loses persistence while the better colonizer can still persist. With $D$ small the inferior competitor can be excluded; raise $c_2$ to widen the range of coexistence.`,
      deps: ['ecol-3.1', 'ecol-4.9'],
      refs: ['Tilman (1994), Ecology 75:2–16, pp.5–6 equations 3.1–4.3; p.16 Appendix A.1–A.3 (triangular stability proof)'],
      tags: ['trade-off', 'metapopulation', 'habitat loss'],
      links: { doi: 'https://doi.org/10.2307/1939377' },
      verify: false,
      viz(v) {
        const c1S = v.slider('colonization rate of the superior competitor $c_1$', 0.2, 1.5, 0.5, { step: 0.01 });
        const c2S = v.slider('colonization rate of the inferior competitor $c_2$', 0.2, 6, 2, { step: 0.01 });
        const mS = v.slider('mortality $m$', 0.02, 0.4, 0.1, { step: 0.01 });
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'fraction of habitat destroyed $D$', ylabel: 'equilibrium occupied fraction', title: 'what survives destruction', weight: 1 });
        const B = v.stage({ x: [0, 300], y: [0, 1], axes: 'box', gutter: true, height: 330, xlabel: 'time', ylabel: 'occupied fraction', title: 'time course', weight: 1 });
        const h = A.handle(0.4, 0, { color: 'gold', r: 8, label: 'D', constrain: (x) => [Math.min(0.99, Math.max(0, x)), 0] });
        const eq=colonizationEquilibrium;
        let info = null;
        v.render(() => {
          const c1 = c1S.value, c2 = c2S.value, m = mS.value, D = h.x;
          A.fn((x) => eq(c1, c2, m, x)[0], { color: 'accent', width: 2.8, domain: [0, 1], n: 400 });
          A.fn((x) => eq(c1, c2, m, x)[1], { color: 'orange', width: 2.8, domain: [0, 1], n: 400 });
          A.fn((x) => Math.max(0, 1 - x - m / c1) + eq(c1, c2, m, x)[1], { color: 'muted', width: 1.2, dash: true, domain: [0, 1], n: 400 });
          const e = eq(c1, c2, m, D);
          A.dot(D, e[0], { r: 5, color: 'accent' }); A.dot(D, e[1], { r: 5, color: 'orange' });
          const threshold=1-m/c1;if(threshold>=0&&threshold<=1)A.vline(threshold,{color:'red',width:1.2,dash:[5,4]});
          const {pa,pb,a:p1,b:p2,start}=runColonization(c1,c2,m,D);
          B.path(pa,{color:'accent',width:2.6});B.path(pb,{color:'orange',width:2.6});
          const interval=colonizationCoexistence(c1,c2,m);
          info={e,D,...interval,p1,p2,start,c1,c2,m};
        });
        v.legend([['accent', 'superior competitor'], ['orange', 'inferior competitor'], ['red', '$D=1-m/c_1$', { dash: true }]]);
        v.readout(() => {if(!info)return'';const I=info,interval=I.empty?'no physical coexistence interval':`${v.fix(I.lo,3)} ${I.includeZero?'≤':'<'} D < ${v.fix(I.hi,3)}`;return String.raw`$D=${v.fix(I.D,2)}$: equilibrium $p_1^*=${v.fix(I.e[0],3)}$, $p_2^*=${v.fix(I.e[1],3)}$. Starting at $p_1=p_2=${v.fix(I.start,4)}$ (total ≤ available habitat ${v.fix(1-I.D,2)}), the finite t=300 trajectory gives ${v.fix(I.p1,3)}, ${v.fix(I.p2,3)}. Coexistence: **${interval}**. ${I.c2<=I.c1?'The inferior species has no colonization advantage. ':''}${I.hi<=0?'The superior cannot persist even at D=0. ':''}Near thresholds the finite trajectory need not equal the equilibrium.`;});
      },
    },
  ],
};
