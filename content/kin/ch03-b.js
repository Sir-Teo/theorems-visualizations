// Chemical Kinetics — Chapter 3: Transition-state theory (items 3.7–3.12)
import { R, clamp, KB, HP, RJ, kTh, HC_K, mkRng, dwell, langevinStep, mfpt, expmSmall, saddle, mep, hessXY, eig2, gradXY, vXY, vRel, fromXY, toXY, M_EFF, H2 } from './ch03.shared.js';

import{HAMMETT_SUB,HAMMETT_RX,hammettSigma,conformers,eyringFlux,GAS,K as SI_K,H as SI_H}from'./kin-source-audit-transition.js';

const NODE_COLORS = ['blue', 'teal', 'green', 'gold', 'orange', 'red', 'pink', 'purple', 'accent'];

export default {
  collection: 'kin',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7', kind: 'Principle', name: 'Bell–Evans–Polanyi principle',
      statement: String.raw`Within a family of closely related reactions, the activation energy varies linearly with the reaction enthalpy,
$$E_a\;=\;E_0+\alpha\,\Delta H,\qquad 0<\alpha<1,$$
so a more exothermic member of the family has a lower barrier. The slope $\alpha$ measures how product-like the transition state is (Hammond, 3.6): $\alpha\approx0$ for an early barrier and $\alpha\approx1$ for a late one. The linearity is an approximation that holds over a restricted range of $\Delta H$; for the crossing-parabola model with equal curvatures it follows from $E^\ddagger=(\lambda+\Delta E)^2/4\lambda$ whose slope is $\alpha=\tfrac12(1+\Delta E/\lambda)$, which stays between 0 and 1 only for $|\Delta E|<\lambda$.`,
      idea: String.raw`Draw each reaction of the family as the same reactant curve crossed by a product curve displaced by its own $\Delta E$. The crossing point (the transition state) moves up and along the reactant curve as the product rises, so $E^\ddagger$ is a smooth increasing function of $\Delta E$; a smooth function is locally linear, with the local slope equal to the fraction of the way along the coordinate at which the crossing lies, which is exactly the Hammond reading of 3.6. Bell (1936) and Evans and Polanyi (1936, 1938) found the relation in acid–base and radical reactions.`,
      caption: String.raw`A family of reactions as reactant parabola and product parabolas shifted by $\Delta E_i$ (left; each colour is one member and its crossing is marked). Right: the activation energy of every member against its $\Delta E$ (dots), the straight-line fit (orange) with slope $\alpha$ and the exact curve of the model (blue). Narrow the family around a centre and the line is excellent; widen it, or move the centre below $-\lambda$, and the fit slope falls and then turns negative (the inverted region). Change the stiffness ratio to bend the curve.`,
      deps: ['kin-3.6'],
      refs: ['Houston'],
      tags: ['linear free energy', 'reactivity'],
      credit: 'Bell, 1936; Evans & Polanyi, 1936 and 1938',
      scope: String.raw`An empirical rule for a series of related reactions with a common mechanism; the model here is two parabolas with $\lambda=100$ kJ/mol and the numbers are not data.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bell%E2%80%93Evans%E2%80%93Polanyi_principle' },
      viz(v) {
        const kR = 200;
        const nS = v.slider('members of the family $n$', 3, 9, 7, { int: true });
        const cen = v.slider('centre $\\Delta E$ (kJ/mol)', -250, 150, 0, { step: 1 });
        const spr = v.slider('spread of $\\Delta E$ (kJ/mol)', 10, 260, 140, { step: 1 });
        const rat = v.slider('stiffness ratio $k_{\\rm P}/k_{\\rm R}$', 0.5, 2, 1, { step: 0.05 });
        const cross = (kP, dE) => {
          const a = kR - kP, b = 2 * kP, c = -kP - 2 * dE;
          const roots = Math.abs(a) < 1e-9 ? [-c / b] : (() => { const d = b * b - 4 * a * c; return d < 0 ? [] : [(-b + Math.sqrt(d)) / (2 * a), (-b - Math.sqrt(d)) / (2 * a)]; })();
          let best = null; for (const r of roots) if (r >= -0.6 && r <= 1.6 && (best === null || Math.abs(r - 0.5) < Math.abs(best - 0.5))) best = r;
          return best;
        };
        const A = v.stage({ x: [-0.4, 1.4], y: [-300, 420], axes: 'box', gutter: true, height: 350, xlabel: 'reaction coordinate x', ylabel: 'E (kJ/mol)', title: 'a family of reactions', weight: 1.1 });
        const B = v.stage({ x: [-300, 300], y: [0, 450], axes: 'box', gutter: true, height: 350, xlabel: 'ΔE (kJ/mol)', ylabel: 'E‡ (kJ/mol)', title: 'activation energy against reaction energy', weight: 1 });
        let info = {};
        v.render(() => {
          const kP = kR * rat.value, n = nS.value, pts = [];
          A.fn((x) => 0.5 * kR * x * x, { color: 'ink', width: 2.6, domain: [-0.4, 1.4] });
          for (let i = 0; i < n; i++) {
            const dE = cen.value + spr.value * (n === 1 ? 0 : i / (n - 1) - 0.5), col = NODE_COLORS[i % NODE_COLORS.length];
            A.fn((x) => 0.5 * kP * (x - 1) ** 2 + dE, { color: col, width: 1.6, alpha: 0.8, domain: [-0.4, 1.4] });
            const xs = cross(kP, dE);
            if (xs !== null) { const E = 0.5 * kR * xs * xs; A.dot(xs, E, { r: 5, color: col }); pts.push({ dE, E, xs, col }); }
          }
          const ex = []; for (let e = -300; e <= 300; e += 5) { const x = cross(kP, e); ex.push(x === null ? null : [e, 0.5 * kR * x * x]); }
          B.path(ex, { color: 'accent', width: 2.2, alpha: 0.75 });
          let fit = null;
          if (pts.length >= 3) { fit = v.M.linreg(pts.map((p) => p.dE), pts.map((p) => p.E)); B.line(-300, fit.slope * -300 + fit.intercept, 300, fit.slope * 300 + fit.intercept, { color: 'orange', width: 2, dash: [7, 4] }); }
          pts.forEach((p) => B.dot(p.dE, p.E, { r: 5.5, color: p.col }));
          const c0 = cen.value, e1 = cross(kP, c0 - 1), e2 = cross(kP, c0 + 1);
          const loc = e1 !== null && e2 !== null ? (0.5 * kR * e2 * e2 - 0.5 * kR * e1 * e1) / 2 : NaN;
          info = { alpha: fit ? fit.slope : NaN, r2: fit ? fit.r2 : NaN, loc, inv: pts.filter((p) => p.xs < 0).length, n: pts.length };
        });
        v.legend([['ink', 'reactant'], ['orange', 'straight-line fit', { dash: true }], ['accent', 'exact model curve']]);
        v.readout(() => `fitted slope $\\alpha=${v.fix(info.alpha, 2)}$ ($r^2=${v.fix(info.r2, 3)}$) — the exact local slope at the centre is $\\tfrac12(1+\\Delta E_c/\\lambda)\\approx${v.fix(info.loc, 2)}$ ${info.alpha < 0 ? '· negative: the family is in the inverted region' : info.alpha > 1 || info.alpha < 0 ? '' : '· between 0 and 1, as the principle says'}${info.inv ? ` · ${info.inv} member(s) cross behind the reactant minimum` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Law', name: 'Hammett equation',
      statement: String.raw`For meta- and para-substituted benzene derivatives reacting at a side-chain, the rate (or equilibrium) constant relative to the unsubstituted compound can approximately follow
$$\log_{10}\frac{k}{k_0}\;=\;\rho\,\sigma,$$
where the **substituent constant** $\sigma$ is a conventionally tabulated reference value for the substituent and its position (it is defined by the ionisation of substituted benzoic acids in water at 25 °C, for which $\rho=1$), and the **reaction constant** $\rho$ depends only on the reaction, its solvent and temperature. A positive $\rho$ means positive-$\sigma$ substituents increase the rate or equilibrium constant; a negative value reverses that trend. Charge redistribution can explain these trends, but the fitted sign alone does not prove a mechanism. For rates with equal prefactors, $\Delta\Delta G^\ddagger=-2.303\,RT\,\rho\sigma$.`,
      idea: String.raw`If a substituent changes the free energy of the transition state by the same fraction of its effect on the benzoate ionisation, $\log k$ is linear in $\log K_{\rm benzoic}$ and so in $\sigma$: a linear free-energy relationship (3.7). The fitted slope measures sensitivity to this reference scale. It does not by itself locate the transition state. The original paper Eq.(2) and Tables I–III provide the selected reference constants and explicitly discuss imperfect correlations.`,
      caption: String.raw`**Synthetic data:** each point is $\rho\sigma$ plus fixed small seeded scatter, except the unsubstituted reference fixed at zero; these are not measured rate constants. The selected $\sigma$ and $\rho$ values are from Hammett (1937) Tables I–III, pp.97–99. His special para-nitro value 1.27 is used for phenol ionisation instead of 0.778. The fitted slopes and generated points are not reproductions of his measured samples. Choose a reaction, switch between meta, para or both, and drag the orange handle to set your own $\rho$ against the least-squares line; click a point to pick a substituent. Right: the free-energy change implied by the fitted slope at 298K: reaction free energy for the phenol equilibrium, activation free energy for the rate examples. This common-temperature conversion is illustrative; the reference slopes were fitted at the listed original conditions.`,
      deps: ['kin-3.7', 'pchem-7.3'],
      refs: ['Hammett, JACS59 (1937),96–103, Eq.(2), Tables I–III pp.97–99 and para-nitro footnotes; original scan OCR read', 'IUPAC Gold Book H02732/V05019, Hammett equation and rho-value'],
      tags: ['linear free energy', 'substituent effects'],
      credit: 'Hammett, 1937',
      verify: false,
      scope: String.raw`Meta- and para-substituted benzenes, side-chain reactions; fails for ortho substituents (steric effects) and for strong resonance interactions with the reaction centre, which need modified constants ($\sigma^+$, $\sigma^-$). Eight selected original-table substituents are shown. The original empirical correlations have reaction-dependent deviations; benzyl hydrolysis was a relatively poor fit.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hammett_equation' },
      viz(v) {
        const SUB=HAMMETT_SUB,RX=HAMMETT_RX;
        const rx = v.select('reaction', [{ value: 'e', label: 'benzoic ester hydrolysis' }, { value: 'p', label: 'phenol ionisation' }, { value: 'a', label: 'base-catalysed bromination' }, { value: 's', label: 'benzoic acid esterification' }, { value: 'b', label: 'benzyl chloride hydrolysis' }], 'e');
        const pos = v.select('substituent position', [{ value: 'p', label: 'para' }, { value: 'm', label: 'meta' }, { value: 'pm', label: 'both' }], 'p');
        const r = v.rng(1937), nz = SUB.map(() => [r.normal(), r.normal()]);
        const A = v.stage({ x: [-0.8, 0.9], y: [-2.4, 2.4], axes: true, height: 350, xlabel: 'σ', ylabel: 'log₁₀ (relative constant)', title: 'Hammett plot', weight: 1.1 });
        const B = v.stage({ x: [-0.5, 11.5], y: [-15, 15], axes: 'box', gutter: true, height: 350, xlabel: 'substituent (sorted by σ)', ylabel: 'ΔΔG (kJ/mol)', title: 'free-energy difference at 298 K', weight: 1 });
        const hRho = A.handle(0.55, 0.55, { color: 'orange', label: 'ρ', constrain: (x, y) => [0.55, clamp(y, -2.2, 2.2)] });
        let sel = 'NO₂p';
        let data = [];
        const build = () => {
          data = []; const rho = RX[rx.value][1];
          SUB.forEach((s, i) => {
            if (pos.value !== 'm') data.push({ n: s[0] + (pos.value === 'pm' ? ' p' : ''), key: s[0] + 'p', sg: hammettSigma(s,'p',rx.value), y: rho*hammettSigma(s,'p',rx.value) + (s[0]==='H'?0:0.07*nz[i][0]), p: 'p' });
            if (pos.value !== 'p' && (s[0] !== 'H'||pos.value==='m')) data.push({ n: s[0] + (pos.value === 'pm' ? ' m' : ''), key: s[0] + 'm', sg: s[2], y: rho * s[2] + (s[0]==='H'?0:0.07*nz[i][1]), p: 'm' });
          });
        };
        A.onClick((x, y) => { let best = null, bd = 1e9; for (const d of data) { const dd = (d.sg - x) ** 2 + ((d.y - y) / 3) ** 2; if (dd < bd) { bd = dd; best = d; } } if (best) { sel = best.key; v.invalidate(); } });
        let info = {};
        v.render(() => {
          build();
          const rho = RX[rx.value][1];
          const fit = v.M.linreg(data.map((d) => d.sg), data.map((d) => d.y));
          const rh=hRho.y/.55;A.setView([-.8,1.35],[-6,6]);if(!data.some(d=>d.key===sel))sel=data[0].key;
          A.hline(0, { color: 'faint' });
          A.line(-0.8, fit.slope * -0.8 + fit.intercept, 1.35,fit.slope*1.35+fit.intercept, { color: 'green', width: 2.2, dash: [7, 4] });
          A.line(-0.8, -0.8 * rh, 1.35,1.35*rh, { color: 'orange', width: 2 });
          const lab=false;
          const byS = data.slice().sort((a, b) => a.sg - b.sg);
          data.forEach((d) => A.dot(d.sg, d.y, { r: d.key === sel ? 7 : 5, color: d.key === sel ? 'gold' : d.p === 'p' ? 'accent' : 'purple', label: lab || d.key === sel ? d.n : undefined, labelPos: byS.indexOf(d) % 2 ? 'se' : 'nw' }));
          const sorted = data.slice().sort((a, b) => a.sg - b.sg);
          const RT = RJ * 298.15 / 1000;
          const vals = sorted.map((d) => -Math.LN10 * RT * fit.slope * d.sg);
          const m = Math.max(5, ...vals.map(Math.abs)) * 1.15; B.setView([-0.5, sorted.length + 0.5], [-m, m]);
          B.hline(0, { color: 'faint' });
          B.bars(vals, { x0: 1, dx: 1, color: (val, i) => (sorted[i].key === sel ? 'gold' : val < 0 ? 'green' : 'red'), });
          B.setTicks(sorted.map((d,i)=>[i+1,String(i+1)]),null);
          const cur = data.find((d) => d.key === sel);
          info = { fit, rho, rh, sel: cur, dd: cur ? -Math.LN10 * RT * fit.slope * cur.sg : NaN, fac: cur ? Math.pow(10, fit.slope * cur.sg) : NaN };
        });
        v.legend([['accent', 'para', { dot: true }], ['purple', 'meta', { dot: true }], ['green', 'least squares', { dash: true }], ['orange', 'your $\\rho$']]);
        v.readout(() => `reference family: ${RX[rx.value][0]} (Table II/III). Bar labels1–${data.length}: ${data.slice().sort((a,b)=>a.sg-b.sg).map(d=>d.n).join(', ')}.\nleast squares: $\\rho=${v.fix(info.fit.slope, 3)}\\pm${v.fix(info.fit.seSlope, 3)}$, $r^2=${v.fix(info.fit.r2, 4)}$ (value used to make the data: $${v.fix(info.rho, 3)}$) · your line: $\\rho=${v.fix(info.rh, 2)}$ — ${info.fit.slope > 0.05 ? 'positive-sigma substituents increase the fitted constant' : info.fit.slope < -0.05 ? 'negative-sigma substituents increase the fitted constant' : 'weak fitted sensitivity to this reference scale'}\n${info.sel ? `selected ${info.sel.n}: $\\sigma=${v.fix(info.sel.sg, 3)}$ → $${rx.value==='p'?'K/K_0':'k/k_0'}=${v.fix(info.fac, info.fac < 10 ? 2 : 0)}$, $\\Delta\\Delta G=${v.fix(info.dd, 1)}$ kJ/mol` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9', kind: 'Principle', name: 'Curtin–Hammett principle',
      statement: String.raw`Let two interconverting species A and B (for example conformers) each react irreversibly to its own product, $\mathrm A\xrightarrow{k_{\rm A}}\mathrm P_{\rm A}$ and $\mathrm B\xrightarrow{k_{\rm B}}\mathrm P_{\rm B}$, and take the fast-interconversion limit relative to both product-formation steps. To leading order A and B stay in pre-equilibrium while the pool drains, and the limiting final product ratio is set by the **difference of the transition-state free energies** measured from a common zero (with equal prefactors), rather than simply the initial population ratio:
$$\frac{[\mathrm P_{\rm B}]}{[\mathrm P_{\rm A}]}\;=\;\frac{K\,k_{\rm B}}{k_{\rm A}}\;=\;\exp\!\Big[-\frac{G^\ddagger_{\rm B}-G^\ddagger_{\rm A}}{RT}\Big],\qquad K=\frac{[\mathrm B]}{[\mathrm A]}=e^{-(G_{\rm B}-G_{\rm A})/RT},$$
with both transition-state energies measured from the same reference. If interconversion is slower than the reactions, the principle fails and the ratio reflects the initial populations.`,
      idea: String.raw`With fast interconversion the pool is always at its equilibrium composition, $[\mathrm B]/[\mathrm A]=K$, so the rates of formation of the products are $k_{\rm A}[\mathrm A]$ and $k_{\rm B}K[\mathrm A]$ and their ratio is $Kk_{\rm B}/k_{\rm A}$. By the Eyring equation (3.2) $K k_{\rm B}/k_{\rm A}$ is the ratio of $e^{-G^\ddagger/RT}$ measured from a common zero, so the stabilities of A and B drop out: a lower-energy transition state gives the major product even if it arises from a minor conformer. This is the rapid-conformer-interconversion definition adopted by IUPAC. The exponential form assumes consistent standard states and equal dynamical prefactors; equilibrium populations still enter through $K$.`,
      caption: String.raw`Left: the free-energy profile, with draggable ledges for $B$ and for the two transition states (the interconversion barrier is a slider). Right: the final product ratio $[\mathrm P_{\rm B}]/[\mathrm P_{\rm A}]$ against the interconversion barrier, computed exactly from the linear kinetic scheme, for a start at equilibrium (blue) and for a start with pure A (orange). Left of the knee the ratio sits on the Curtin–Hammett line (green); at slow interconversion, an equilibrium start approaches its initial B/A population ratio (grey), while a pure-A start approaches zero. Intermediate barriers need the full kinetic solution.`,
      deps: ['kin-3.2', 'kin-1.9'],
      refs: ['IUPAC Gold Book C01480, Curtin–Hammett principle; PAC66 (1994),1102; exact absorbing two-state mass-action calculation independently derived'],
      tags: ['selectivity', 'conformers'],
      credit: 'Curtin–Hammett principle as defined by IUPAC',
      verify: false,
      scope: String.raw`Two species interconverting by a first-order process, each reacting irreversibly by a first-order step; the free energies are illustrative and the temperature is a parameter. All Eyring prefactors and transmission factors are equal. The interconversion barrier is at least 42kJ/mol so it exceeds both conformer energies across all controls.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Curtin%E2%80%93Hammett_principle' },
      viz(v) {
        const Tm = v.slider('$T$ (K)', 250, 400, 298, { step: 1 });
        const gInt = v.slider('interconversion barrier (kJ/mol)', 42, 140, 50, { step: 1 });
        const start = v.select('start', [{ value: 'eq', label: 'at equilibrium' }, { value: 'A', label: 'pure A' }], 'eq');
        const A = v.stage({ x: [-3.2, 8.2], y: [-50, 120], axes: 'box', gutter: true, height: 350, ylabel: 'G (kJ/mol)', title: 'free-energy profile', weight: 1.15 });
        const B = v.stage({ x: [42, 140], y: [1e-4, 1e3], ylog: true, axes: 'box', gutter: true, height: 350, xlabel: 'interconversion barrier (kJ/mol)', ylabel: 'P(B) / P(A)', title: 'final product ratio', weight: 1 });
        const hB = A.handle(4.2, 8, { color: 'orange', label: 'B', constrain: (x, y) => [4.2, clamp(y, -15, 40)] });
        const hA = A.handle(-1, 76, { color: 'accent', label: 'TS A', constrain: (x, y) => [-1, clamp(y, 50, 105)] });
        const hT = A.handle(5.6, 82, { color: 'purple', label: 'TS B', constrain: (x, y) => [5.6, clamp(y, 50, 105)] });
        const gPA = -35, gPB = -35;
        const ratio=conformers;
        const ledge = (x, y, col, lab, w = 0.35) => { A.line(x - w, y, x + w, y, { color: col, width: 3.4 }); if (lab) A.tex(lab, x, y - 11, { size: 13, color: 'muted', align: 'center' }); };
        const link = (x1, y1, x2, y2, w = 0.35) => A.curve((x) => [x, y1 + (y2 - y1) * (1 - Math.cos(Math.PI * (x - (x1 + w)) / ((x2 - w) - (x1 + w)))) / 2], x1 + w, x2 - w, { n: 30, color: 'ink', width: 1.6, alpha: 0.7 });
        let info = {};
        v.render(() => {
          const gB = hB.y, gA = hA.y, gTB = hT.y, T = Tm.value, st = start.value;
          const RT = RJ * T / 1000, GI=gInt.value;
          A.setView([-3.2,8.2],[-50,Math.max(120,GI+18)]);
          const xs = [-2.2, -1, 1, 2.6, 4.2, 5.6, 7], ys = [gPA, gA, 0, GI, gB, gTB, gPB];
          for (let i = 0; i < 6; i++) link(xs[i], ys[i], xs[i + 1], ys[i + 1]);
          ledge(-2.2, gPA, 'ink', '\\mathrm P_A'); ledge(-1, gA, 'accent'); ledge(1, 0, 'ink', '\\mathrm A'); ledge(2.6, GI, 'ink'); ledge(4.2, gB, 'orange'); ledge(5.6, gTB, 'purple'); ledge(7, gPB, 'ink', '\\mathrm P_B');
          A.text('interconversion', 2.6, GI + 7, { size: 11, color: 'muted', align: 'center' });
          const here = ratio(T, gB, gA, gTB, GI, st), CH = Math.exp(-(gTB - gA) / RT), K = Math.exp(-gB / RT);
          const f=a=>a;
          const pts1 = [], pts2 = []; for (let g=42;g<=140;g+=2) { pts1.push([g, f(ratio(T, gB, gA, gTB, g, 'eq').r)]); pts2.push([g, f(ratio(T, gB, gA, gTB, g, 'A').r)]); }
          const all=[CH,K,here.r,...pts1.map(p=>p[1]),...pts2.map(p=>p[1])];B.setView([42,140],[Math.min(...all)/2,Math.max(...all)*2]);
          B.hline(f(CH), { color: 'green', width: 2, dash: [7, 4] });
          B.hline(f(K), { color: 'faint', width: 1.6, dash: [3, 4] });
          B.path(pts2, { color: 'orange', width: 2, dash: [5, 3] }); B.path(pts1, { color: 'accent', width: 2.6 });
          B.dot(GI, f(here.r), { r: 6.5, color: 'gold' });
          info = { r: here.r, CH, K, gB, dG: gTB - gA, GI, kA: here.kA, kB: here.kB, kint: here.kAB,kback:here.kBA, T, st };
        });
        v.legend([['accent', 'start at equilibrium'], ['orange', 'start with pure A', { dash: true }], ['green', 'Curtin–Hammett prediction', { dash: true }], ['faint', 'initial ratio $K$', { dash: true }], ['gold', 'your barrier', { dot: true }]]);
        v.readout(() => `$[\\mathrm P_{\\rm B}]/[\\mathrm P_{\\rm A}]=${v.sci(info.r, 3)}$ · Curtin–Hammett $e^{-\\Delta\\Delta G^\\ddagger/RT}=${v.sci(info.CH, 3)}$ (with $\\Delta\\Delta G^\\ddagger=G^\\ddagger_{\\rm B}-G^\\ddagger_{\\rm A}=${v.fix(info.dG, 1)}$ kJ/mol) · population ratio $K=[\\mathrm B]/[\\mathrm A]=${v.sci(info.K, 2)}$\nrate constants: A→B $${v.sci(info.kint, 2)}\\ \\mathrm{s^{-1}}$, B→A $${v.sci(info.kback,2)}$ s⁻¹, $k_{\\rm A}=${v.sci(info.kA, 2)}$, $k_{\\rm B}=${v.sci(info.kB, 2)}$ s⁻¹ — ${info.kint>30*info.kA&&info.kback>30*info.kB ? 'interconversion is much faster than reaction: the principle applies' : info.kint<info.kA/30&&info.kback<info.kB/30 ? 'interconversion is much slower than reaction: product fractions approach the starting populations' : 'in between: neither limit holds'}`);
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10', kind: 'Concept', name: 'Kinetic versus thermodynamic control',
      statement: String.raw`When a reactant A can form two products by competing reversible steps, $\mathrm A\rightleftharpoons\mathrm P_1$ and $\mathrm A\rightleftharpoons\mathrm P_2$, the product mixture depends on how long and how hot the reaction is run. At short times and low temperature the products are formed in proportion to their formation rate constants, $[\mathrm P_2]/[\mathrm P_1]=k_{f2}/k_{f1}$ (**kinetic control**: the product with the lower barrier wins). After the reverse steps have had time to act, $[\mathrm P_2]/[\mathrm P_1]=K_2/K_1=e^{-(G_{\mathrm P_2}-G_{\mathrm P_1})/RT}$ (**thermodynamic control**: the more stable product wins). Kinetic control needs $k_{r}$ for the faster product to be negligible on the time scale of the experiment.`,
      idea: String.raw`The scheme is linear, so the populations are $\mathbf y(t)=e^{\mathbf Mt}\mathbf y_0$ with the rate matrix $\mathbf M$, and the late-time limit is the equilibrium of 1.9 extended to three species. The two rate-constant sets are linked to the free-energy profile by the Eyring equation (3.2): $k=(k_BT/h)e^{-\Delta G^\ddagger/RT}$. The fast product's reverse step is faster than the slow product's formation, so the early excess of $\mathrm P_1$ is drained into $\mathrm P_2$; raising $T$ speeds every step, but the exponentials in $1/T$ speed the high barriers most, which is why heating moves the boundary to shorter times.`,
      caption: String.raw`Free-energy parameters are sliders (illustrative values). Left: the profile. Middle: the fraction of $\mathrm P_2$ among the products $[\mathrm P_2]/([\mathrm P_1]+[\mathrm P_2])$ over temperature and $\log_{10}$ of time (blue: kinetic product $\mathrm P_1$ dominates, red: thermodynamic product $\mathrm P_2$). Drag the gold handle to pick a temperature and a time. Right: the three populations against $\log_{10}t$ at your temperature, with your time marked: $\mathrm P_1$ rises first and then gives way to $\mathrm P_2$.`,
      deps: ['kin-3.2', 'kin-1.9'],
      refs: ['Houston'],
      tags: ['selectivity', 'equilibrium'],
      scope: String.raw`Two first-order competing reversible steps from a common reactant, exact for the linear scheme with Eyring rate constants (transmission coefficient 1, no entropy of activation); the free energies are illustrative, not those of a particular reaction.`,
      viz(v) {
        const g1 = v.slider('$\\Delta G^\\ddagger_1$ (kJ/mol)', 50, 90, 70, { step: 1 });
        const g2 = v.slider('$\\Delta G^\\ddagger_2$ (kJ/mol)', 70, 110, 85, { step: 1 });
        const p1 = v.slider('$G(\\mathrm P_1)$ (kJ/mol)', -30, 10, -5, { step: 1 });
        const p2 = v.slider('$G(\\mathrm P_2)$ (kJ/mol)', -60, 0, -25, { step: 1 });
        const A = v.stage({ x: [-2.2, 4.6], y: [-70, 125], axes: 'box', gutter: true, height: 330, ylabel: 'G (kJ/mol)', title: 'profile', weight: 0.8, minWidth: 240 });
        const C = v.stage({ x: [200, 500], y: [-3, 12], axes: 'box', gutter: true, height: 330, xlabel: 'T (K)', ylabel: 'log₁₀ (t / s)', title: 'which product dominates', weight: 1.1, minWidth: 260 });
        const B = v.stage({ x: [-3, 12], y: [0, 1.02], axes: 'box', gutter: true, height: 330, xlabel: 'log₁₀ (t / s)', ylabel: 'fraction', title: 'populations at your T', weight: 1.1, minWidth: 260 });
        const hh = C.handle(298, 4, { color: 'gold', label: '(T, t)', constrain: { x: [200, 500], y: [-3, 12] } });
        const pops = (T, t) => {
          const RT = RJ * T / 1000, f = (G) => kTh(T) * Math.exp(-G / RT);
          const kf1 = f(g1.value), kr1 = f(g1.value - p1.value), kf2 = f(g2.value), kr2 = f(g2.value - p2.value);
          const M = [[-(kf1 + kf2), kr1, kr2], [kf1, -kr1, 0], [kf2, 0, -kr2]];
          const E = expmSmall(M, t);
          let y = [E[0][0], E[1][0], E[2][0]];
          if (!y.every(isFinite) || Math.abs(y[0] + y[1] + y[2] - 1) > 0.05) { const K1 = kf1 / kr1, K2 = kf2 / kr2, Z = 1 + K1 + K2; y = [1 / Z, K1 / Z, K2 / Z]; }
          const sm = y[0] + y[1] + y[2]; y = y.map((q) => Math.max(0, q / sm));
          return { y, kf1, kr1, kf2, kr2 };
        };
        const key = () => [g1.value, g2.value, p1.value, p2.value].join(',');
        const led = (x, y, col, lab) => { A.line(x - 0.4, y, x + 0.4, y, { color: col, width: 3.4 }); if (lab) A.text(lab, x, y - 10, { size: 11.5, color: 'muted', align: 'center' }); };
        const lk = (x1, y1, x2, y2, w = 0.4) => A.curve((x) => [x, y1 + (y2 - y1) * (1 - Math.cos(Math.PI * (x - (x1 + w)) / ((x2 - w) - (x1 + w)))) / 2], x1 + w, x2 - w, { n: 24, color: 'ink', width: 1.6, alpha: 0.7 });
        let info = {};
        v.render(() => {
          const xs = [-1.7, -0.8, 0.5, 1.8, 2.8, 3.8], ys = [p1.value, g1.value, 0, g2.value, p2.value];
          const px = [-1.7, -0.9, 0.3, 1.5, 2.7];
          for (let i = 0; i < 4; i++) lk(px[i], ys[i], px[i + 1], ys[i + 1]);
          led(-1.7, p1.value, 'accent', 'P₁'); led(-0.9, g1.value, 'accent'); led(0.3, 0, 'ink', 'A'); led(1.5, g2.value, 'red'); led(2.7, p2.value, 'red', 'P₂');
          const T0 = hh.x, lt = hh.y;
          // map of the P2 fraction among the products, cached by parameters
          C.raster((T, l) => { const q = pops(T, Math.pow(10, l)).y, s = q[1] + q[2]; if (s < 1e-3) return null; const c = v.diverge(2 * q[2] / s - 1, 'accent', 'red'); return [c[0], c[1], c[2], 1]; }, { res: 7, key: 'cmap' + key() });
          C.axes();
          C.hline(lt, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.6 }); C.vline(T0, { color: 'ink', width: 1, dash: [3, 4], alpha: 0.6 });
          const curveA = [], c1 = [], c2 = [];
          for (let l = -3; l <= 12.001; l += 0.15) { const q = pops(T0, Math.pow(10, l)).y; curveA.push([l, q[0]]); c1.push([l, q[1]]); c2.push([l, q[2]]); }
          B.path(curveA, { color: 'faint', width: 2.2 }); B.path(c1, { color: 'accent', width: 2.6 }); B.path(c2, { color: 'red', width: 2.6 });
          B.vline(lt, { color: 'gold', width: 1.6, dash: [4, 4] });
          const now = pops(T0, Math.pow(10, lt)), RT = RJ * T0 / 1000;
          info = { T: T0, lt, y: now.y, kin: now.kf2 / now.kf1, th: Math.exp(-(p2.value - p1.value) / RT), kf1: now.kf1, kr1: now.kr1, kf2: now.kf2, kr2: now.kr2 };
        });
        v.legend([['faint', 'A'], ['accent', 'P₁ (kinetic product)'], ['red', 'P₂ (thermodynamic product)']]);
        v.readout(() => `at $T=${v.fix(info.T, 0)}$ K, $t=10^{${v.fix(info.lt, 1)}}$ s: $[\\mathrm A]=${v.fix(info.y[0], 3)}$, $[\\mathrm P_1]=${v.fix(info.y[1], 3)}$, $[\\mathrm P_2]=${v.fix(info.y[2], 3)}$ → $\\mathrm P_2/\\mathrm P_1=${v.sci(info.y[2] / Math.max(info.y[1], 1e-300), 2)}$\nkinetic limit $k_{f2}/k_{f1}=${v.sci(info.kin, 2)}$ · thermodynamic limit $e^{-\\Delta G^\\circ/RT}=${v.sci(info.th, 2)}$ · rough time to reach equilibrium (fast pre-equilibrium of A and P₁, then the slow step) $(1+k_{f1}/k_{r1})/k_{f2}\\approx${v.sci((1 + info.kf1 / info.kr1) / info.kf2, 1)}$ s`);
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11', kind: 'Model', name: 'Kramers theory of barrier crossing',
      statement: String.raw`Model the reaction coordinate $x$ as a Brownian particle of mass $m$ in a potential well $V(x)$ with a barrier of height $E_b\gg k_BT$, coupled to a thermal bath by a friction $\gamma$ (Langevin equation $m\ddot x=-V'-m\gamma\dot x+\xi$). Kramers (1940) found the escape rate in two limits. For moderate and strong friction (spatial diffusion),
$$k\;=\;\frac{\omega_a}{2\pi}\;\frac{\sqrt{\gamma^2/4+\omega_b^2}-\gamma/2}{\omega_b}\;e^{-E_b/k_BT},$$
which equals the transition-state value $(\omega_a/2\pi)e^{-E_b/k_BT}$ for $\gamma\to0$ and falls as $\omega_b/\gamma$ for $\gamma\gg\omega_b$. For weak friction the rate is limited by energy supply instead, $k=\gamma\,(I_b/k_BT)\,(\omega_a/2\pi)\,e^{-E_b/k_BT}$ with $I_b$ the action of the orbit at the barrier energy, which *rises* with $\gamma$. The rate therefore passes through a maximum below the TST value as $\gamma$ varies: the **Kramers turnover**.`,
      idea: String.raw`Transition-state theory (3.1) assumes that a trajectory that crosses the barrier top never comes back. Friction breaks this in two opposite ways: at large $\gamma$ the bath keeps kicking the particle back across the top, so each successful escape is a diffusive random walk and $k\propto1/\gamma$; at small $\gamma$ the particle does not exchange energy with the bath quickly enough to be re-supplied after leaving the well, so the rate is proportional to $\gamma$. Between them TST is a ceiling that is approached from below. The Fokker–Planck equation (thermo-7.12) is the exact description from which Kramers derived both limits; a unified formula for all $\gamma$ was found much later.`,
      caption: String.raw`**Simulation:** Langevin dynamics with the BAOAB integrator for a double well $V=\Delta V(x^2-1)^2$ with $\Delta V=5\,k_BT$ (reduced units $m=k_BT=1$). The gold dots are $1/\tau$, with $\tau$ the mean time to go from the left minimum to the right minimum over 50 runs per point (error bars are one standard error); the green curve is Kramers' formula for moderate and strong friction, the red dashed curve the weak-friction formula, and the line at 1 is exact classical TST. The upper panel shows one trajectory at your friction. They are computed at load time (a few seconds for the whole curve) and recomputed with *Resample*.`,
      deps: ['kin-3.1', 'pchem-10.4', 'thermo-7.12'],
      refs: ['Steinfeld et al.'],
      tags: ['friction', 'Kramers turnover'],
      credit: 'Kramers, 1940',
      scope: String.raw`A one-dimensional reaction coordinate with Markovian (memoryless) friction and a barrier well above $k_BT$; at $\Delta V=5\,k_BT$ the simulated rates deviate from the asymptotic formulas by tens of per cent, especially near the turnover. Solvent memory (Grote–Hynes) is not included.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kramers%27_escape_problem' },
      viz(v) {
        const W = dwell(5), kT = W.kTST(0), GS = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30];
        const g = v.slider('friction $\\gamma$', 0.01, 30, 1, { log: true, sig: 2 });
        let pts = [], seed = 5, token = 0, timer = null, busy = false;
        const run = (sync) => {
          token++; const my = token; pts = []; busy = true; if (timer) clearTimeout(timer);
          const step = (i) => {
            if (my !== token) return;
            if (i >= GS.length) { busy = false; v.invalidate(); return; }
            const r = mfpt(W, GS[i], 50, seed * 100 + i, { tmax: 30000 });
            pts.push({ g: GS[i], k: 1 / r.tau, e: (r.err / r.tau) / r.tau });
            v.invalidate();
            if (sync) step(i + 1); else timer = setTimeout(() => step(i + 1), 0);
          };
          step(0);
        };
        v.onCleanup(() => { token++; if (timer) clearTimeout(timer); });
        v.button('Resample', () => { seed++; run(false); });
        const A = v.stage({ x: [0, 400], y: [-2.1, 2.1], axes: 'box', gutter: true, height: 230, xlabel: 'time (reduced units)', ylabel: 'x', title: 'one trajectory at your friction', full: true });
        const B = v.stage({ x: [0.01, 30], y: [0.02, 2], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'friction γ (reduced units)', ylabel: 'k / kTST', title: 'Kramers turnover', full: true });
        let cache = { key: '', tr: [] };
        const traj = (gv) => {
          const key = gv.toFixed(4); if (cache.key === key) return cache.tr;
          const rnd = mkRng(77), x = new Float64Array([-1]), p = new Float64Array([0]), tr = [];
          const dt = 0.02; for (let i = 0; i < 20000; i++) { langevinStep(W, x, p, gv, dt, rnd); if (i % 5 === 0) tr.push([i * dt, x[0]]); }
          cache = { key, tr }; return tr;
        };
        run(!!(typeof window !== 'undefined' && window.__vizStill));
        let info = {};
        v.render(() => {
          const gv = g.value;
          A.hline(0, { color: 'faint', dash: [3, 4] }); A.hline(-1, { color: 'faint' }); A.hline(1, { color: 'faint' });
          A.path(traj(gv), { color: 'accent', width: 1.3 });
          B.hline(1, { color: 'ink', width: 1.6, dash: [6, 4] });
          B.curve((x) => [x, W.kKramers(x) / kT], 0.01, 30, { n: 120, color: 'green', width: 2.4 });
          B.curve((x) => [x, Math.min(5, W.kLow(x) / kT)], 0.01, 0.9, { n: 60, color: 'red', width: 2, dash: [5, 4] });
          for (const p of pts) { B.line(p.g, Math.max(0.021, (p.k - p.e) / kT), p.g, (p.k + p.e) / kT, { color: 'gold', width: 1.4 }); B.dot(p.g, p.k / kT, { r: 5.5, color: 'gold' }); }
          B.vline(gv, { color: 'orange', dash: [3, 4] });
          let nc = 0; { const tr = cache.tr; for (let i = 1; i < tr.length; i++) if ((tr[i - 1][1] < 0) !== (tr[i][1] < 0) && Math.abs(tr[i][1]) < 0.6) nc++; }
          info = { gv, kTST: kT, kK: W.kKramers(gv), kL: W.kLow(gv), n: pts.length, nc };
        });
        v.legend([['gold', 'simulation: 1/mean passage time', { dot: true }], ['green', 'Kramers, moderate and strong friction'], ['red', 'Kramers, weak friction', { dash: true }], ['ink', 'classical TST', { dash: true }]]);
        v.readout(() => `$\\Delta V=5\\,k_BT$: $\\omega_a=${v.fix(W.w0, 2)}$, $\\omega_b=${v.fix(W.wb, 2)}$; TST rate $${v.sci(info.kTST, 3)}$ per unit time\nat $\\gamma=${v.fix(info.gv, 2)}$: strong-friction formula $k/k_{\\rm TST}=${v.fix(info.kK / info.kTST, 3)}$, weak-friction formula $${info.gv < 0.3 ? v.fix(info.kL / info.kTST, 3) : '\\text{(not valid here)}'}$ · barrier crossings of the plotted trajectory: ${info.nc} · ${info.n} of ${GS.length} simulated points ready${busy ? ' (computing…)' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12', kind: 'Paper', name: 'The Activated Complex in Chemical Reactions',
      statement: String.raw`Eyring calculates absolute reaction rates from the partition functions of reactants and of an activated complex near a saddle point. Removing the unstable reaction coordinate leaves $F_a'$; the removed coordinate's translational factor multiplied by the equilibrium mean positive part of velocity gives $k_BT/h$. His general Eq.(10), p.113, has the form
$$k=c\,\frac{F_a'}{F_n}\frac{k_BT}{h}e^{-E_0/k_BT}.$$
The paper already includes $c$, the reciprocal average number of crossings needed for reaction (p.110), rather than leaving a transmission coefficient for a later addition. It treats three-atom, four-atom and unimolecular cases; quantized modes change isotope dependence. Pages114–115 derive collision theory as a limiting case.`,
      idea: String.raw`For a short dividing-surface length $\ell$ and reaction-coordinate mass $m$, the classical translational factor is $Q_\ell=\ell\sqrt{2\pi m k_BT}/h$. Multiplication by the equilibrium mean positive part of velocity divided by length, $\sqrt{k_BT/(2\pi m)}/\ell$, cancels both $m$ and $\ell$, leaving $k_BT/h$. The remaining partition-function ratio and barrier encode molecular structure. This calculation isolates the central cancellation of pp.109–110 and113; molecular partition functions, recrossing and nonclassical nuclear effects still require additional physics.`,
      caption: String.raw`A direct numerical illustration of the paper's prefactor argument, not a molecule-specific rate calculation. Left: the translational factor $Q_\ell$ grows with reaction-coordinate mass. Middle: multiplying it by mean positive part of velocity per length gives the same $k_BT/h$ at every mass (blue), with $c$ times this value in orange. Right: model rates for a fixed illustrative remaining partition ratio $F_a'/F_n=1$ at 200, 300 and 500K; the gold point uses your temperature and barrier. Change the arbitrary dividing length: the partition factor changes but its product does not.`,
      deps: ['kin-2.6','kin-2.7','thermo-6.2','kin-2.12'],
      refs: ['Eyring (1935), full original pp.107–115: partition functions pp.108–110, recrossing factor c p.110, general Eq.(10) p.113, collision limit pp.114–115; original scan OCR and separately typeset complete body crosschecked', 'NIST CODATA2022 wall chart: h, k, N_A and atomic mass constant (2022 central value)'],
      tags: ['history','transition-state theory'],credit:'Henry Eyring, 1935',verify:false,
      paper:{authors:'Henry Eyring',year:1935,title:'The Activated Complex in Chemical Reactions',venue:'The Journal of Chemical Physics 3 (2):107–115',doi:'10.1063/1.1749604'},
      introduces:['kin-3.1','kin-3.2'],
      scope:String.raw`This illustration reproduces the paper's partition-factor algebra, not its molecule-specific numbers or a modern LEPS trajectory calculation. A single unimolecular standard state and unit remaining partition ratio are chosen; the displayed c is a model input, not a measured recrossing probability.`,
      viz(v){
        const temp=v.slider('$T$ (K)',150,800,298,{step:1}),mass=v.slider('coordinate mass (u)',.5,20,1,{step:.1}),length=v.slider('dividing length (Å)',.05,2,.5,{step:.01}),cross=v.slider('crossing factor $c$',.05,1,1,{step:.01}),barrier=v.slider('$E_0$ (kJ/mol)',0,100,50,{step:1});
        const A=v.stage({x:[.5,20],y:[0,100],axes:'box',gutter:true,height:330,xlabel:'coordinate mass (u)',ylabel:'Qℓ (dimensionless)',title:'reaction-coordinate partition factor',weight:1}),B=v.stage({x:[.5,20],y:[0,2e13],axes:'box',gutter:true,height:330,xlabel:'coordinate mass (u)',ylabel:'frequency (10¹² s⁻¹)',title:'mass and length cancel',weight:1}),D=v.stage({x:[0,100],y:[1e-15,1e14],ylog:true,axes:'box',gutter:true,height:330,xlabel:'barrier E₀ (kJ/mol)',ylabel:'k (s⁻¹)',title:'unit remaining partition ratio',weight:1});
        let info={};v.render(()=>{const T=temp.value,m=mass.value,l=length.value,c=cross.value,E=barrier.value,q=eyringFlux(T,m,l,c,E);A.setView([-.5,21],[0,eyringFlux(T,20,l).Q*1.15]);B.setView([-.5,21],[0,SI_K*T/SI_H*1.2e-12]);const rates=[200,300,500,T].flatMap(t=>[eyringFlux(t,m,l,c,100).rate,eyringFlux(t,m,l,c,0).rate]);D.setView([-5,105],[Math.min(...rates)/100,Math.max(...rates)*100]);A.fn(x=>eyringFlux(T,x,l).Q,{color:'accent',width:2.4,domain:[.5,20]});A.dot(m,q.Q,{color:'gold',r:6});B.fn(x=>eyringFlux(T,x,l).pref/1e12,{color:'accent',width:2.4,domain:[.5,20]});B.hline(c*q.pref/1e12,{color:'orange',width:2,dash:[5,4]});B.dot(m,q.pref/1e12,{color:'gold',r:6});for(const[t,col]of[[200,'purple'],[300,'green'],[500,'red']])D.fn(e=>eyringFlux(t,m,l,c,e).rate,{color:col,width:2,domain:[0,100]});D.dot(E,q.rate,{color:'gold',r:6});info={...q,T,m,l,c,E};});
        v.legend([['accent','partition factor / kBT/h'],['orange','c × kBT/h',{dash:true}],['purple','200K'],['green','300K'],['red','500K'],['gold','your inputs',{dot:true}]]);
        v.readout(()=>`$Q_\\ell=${v.fix(info.Q,4)}$, mean positive part of velocity $${v.fix(info.speed,2)}$ m/s at $m=${v.fix(info.m,1)}$ u, $\\ell=${v.fix(info.l,2)}$ Å.\n$Q_\\ell\\langle v_+\\rangle/\\ell=${v.sci(info.pref,4)}$ s⁻¹, exactly $k_BT/h$ up to floating-point roundoff. Model $c=${v.fix(info.c,2)}$, $E_0=${info.E}$ kJ/mol, $k=${v.sci(info.rate,3)}$ s⁻¹ at ${info.T}K.`);
      },
    },
  ],
};
