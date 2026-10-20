// Energy Systems — Chapter 3: Fuels and nuclear energy (items 3.6–3.10; part b)
//
// SOURCES AND PROVENANCE (checked October 2026 unless marked "from memory")
//   3.6 DOE-HDBK-1019/2-93 NP03 pp1–16, including the stated U235/U238 teaching inputs and p7 reproduction example.
//     Moderator absorption: NIST NCNR 2200m/s table. Resonance/slowing and fast-fission parameters are declared choices.
//     source-audit-chain.shared.js separates source inputs from this schematic model and retains full Poisson populations.
//   3.7/3.8 DOE-HDBK-1019/1-93 NP02Table3; six printed fractions/half-lives and numerical models in source-audit-kinetics.shared.js.
//   3.9 Untermyer & Weills, AECD-3454 (1952), inspected complete original: p4Eq2 finite-irradiation heat fit,
//     natural uranium (conversion ratio≈0.8), including U239/Np239 and excluding delayed-neutron fission. Historical uncertainty is stated.
//     source-audit-decay.shared.js integrates that fit and separates sensible warming from evaporation.
//   3.10 Original Lawson1957 complete paper read; modern transport/self-heating extension distinguished explicitly.
//     Original Bosch–Hale1992 Eqs12–14/TableVII plus actual1993erratum read; D–T fit remains0.2–100keV.
//     The erratum’s0.5–100keV correction concerns its separate Eq16 D–D branching-ratio polynomial.
//     Wurzel–Hsu2022 author manuscript SecIII: gain definitions, bremsstrahlung and modern power-balance derivation.
//     source-audit-fusion.shared.js; no uninspected experiment-headline ladder or low-energy-fit extrapolation.


import { clamp, lerp, BETA, DN_BETA, DN_LAM, kinMatrix, kinEq, inhour, satT } from './ch03.shared.js';

import {kinStepCurveAudit, kinProgramAudit} from './source-audit-kinetics.shared.js';
import {decayFractionAudit,decayWaterAudit} from './source-audit-decay.shared.js';
import {CHAIN_MODERATORS_AUDIT,chainFactorsAudit,poissonSurvivalAudit,chainGenerationsAudit} from './source-audit-chain.shared.js';
import fusionErratumItem from './fusion-erratum-item.js';

const f1 = (v, x) => v.fix(x, 1), f2 = (v, x) => v.fix(x, 2);

export default {
  collection: 'energy',
  chapter: 3,
  items: [
    // ───────────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6', kind: 'Model', name: 'Chain reaction and the multiplication factor',
      statement: String.raw`Let $k$ be the mean number of next-generation neutrons per present neutron. With independent offspring and a fixed $k$, the **expected** population is $\mathbb E[Z_g]=Z_0k^g$. Subcritical ($k<1$) means a decreasing mean, critical ($k=1$) a constant mean, and supercritical ($k>1$) an increasing mean. A random lineage need not follow that mean. For a thermal-reactor neutron balance neglecting leakage,
$$k_\infty=\eta f p\varepsilon,$$
where $\eta$ is fission neutrons per thermal absorption in fuel, $f$ the share of thermal absorptions occurring in fuel, $p$ the probability of avoiding resonance absorption during slowing down, and $\varepsilon$ the fast-fission multiplier. Combining the fast and thermal non-leakage factors into $P_{NL}$ gives $k_{\rm eff}=k_\infty P_{NL}$. These factors summarize a neutron life cycle; they do not determine the spatial flux.`,
      idea: String.raw`For the two-isotope teaching mixture, under the equal-thermal-flux approximation,
$$\eta=\frac{\nu e\sigma_{f,235}}{e\sigma_{a,235}+(1-e)\sigma_{a,238}},$$
where $e$ is the U-235 **atom fraction**. Utilization $f$ divides fuel absorption by total absorption in fuel, moderator and the chosen control absorber. Thus $\eta f$ is fission-neutron production divided by total thermal absorption. Increasing moderator content improves the chosen resonance-escape factor while adding thermal absorption; both effects matter.

The separate stochastic illustration assumes Poisson offspring of mean $k_{\rm eff}$. Its extinction probability is the smallest root of $q=\exp[k_{\rm eff}(q-1)]$, since all children must become extinct. For $k_{\rm eff}\le1$, extinction occurs with probability one even at criticality, despite the constant critical mean. Above one, a positive survival probability remains; four independent sources survive with probability $1-q^4$.`,
      caption: String.raw`Choose a moderator and move the U-235 atom fraction, moderator ratio, absorber and non-leakage controls. The bars show the four factors and their products. The tree follows four sources through nine Poisson generations; *Resample* changes the random run. Every child is retained in the simulation. When a generation exceeds 60 neutrons, evenly spaced representatives and their incoming branches are drawn; the readout reports the full population.`,
      deps: ['energy-3.5'],
      refs: ['DOE-HDBK-1019/2-93, NP-03 pp. 1–16: complete neutron-life-cycle section and p. 7 reproduction example', 'NIST NCNR neutron cross-section table: moderator absorption at 2200 m/s', 'Poisson branching mean and extinction equation derived here'],
      links: {primary:'https://ncsp.llnl.gov/sites/ncsp/files/2024-03/doe_fundamentals_handbook_nuclear_physics_and_reactor_theory_vol_2_of_2.pdf',moderator:'https://www.ncnr.nist.gov/resources/n-lengths/list.html'},
      tags: ['chain reaction', 'criticality', 'neutron multiplication'],
      scope: String.raw`Schematic neutron balance, not a lattice or transport calculation. The inspected DOE teaching example supplies $\nu=2.42$, $\sigma_{f,235}=582$ b, $\sigma_{a,235}=694$ b and $\sigma_{a,238}=2.71$ b; these historical rounded inputs are not presented as a current evaluated library. Moderator absorption uses the inspected NIST table, with molecular sums for water and no impurities. The utilization formula assumes equal thermal flux in fuel and moderator. Chosen effective slowing parameters are 40, 5.3 and 0.75 b per H₂O molecule, D₂O molecule and C atom; $p=\exp[-(1-e)25/(R b_{\rm slow})]$ and $\varepsilon=1.03$ are illustrative choices. They are not a computed resonance integral, geometry or homogeneous-core fast-fission result. No real design's criticality or natural-uranium feasibility is inferred. The Poisson process is an independent mathematical analogy with fixed mean, no source replenishment, feedback, spatial coupling or burnup.`,
      verify: false,
      viz(v) {
        const MOD=CHAIN_MODERATORS_AUDIT;
        const s=v.stage({x:[0,5.4],y:[-.3,2.35],axes:false,height:270,minWidth:340});
        const s2=v.stage({x:[0,10],y:[-.17,1.28],axes:false,height:270,minWidth:340});
        const mod=v.select('moderator',Object.entries(MOD).map(([value,m])=>({value,label:m.n})),'h2o',{onChange:()=>ratio.set(MOD[mod.value].N0)});
        const en=v.slider('U-235 atom fraction (%)',.72,20,3,{step:.01,log:true});
        const ratio=v.slider('moderator units per uranium atom',.3,1000,3,{step:.1,log:true});
        const ctl=v.slider('control absorber (barns per U atom)',0,30,6,{step:.5});
        const leak=v.slider('non-leakage probability $P_{NL}$',.5,1,.97,{step:.005});
        let seed=7,C,layers;v.button('Resample',()=>{seed++;});
        const calc=()=>chainFactorsAudit({moderator:mod.value,fraction:en.value/100,ratio:ratio.value,absorber:ctl.value,nonleakage:leak.value});
        v.render(()=>{
          C=calc();layers=chainGenerationsAudit(v.rng(seed*101+3),C.keff);
          const fac=[['η',C.eta,'accent'],['f',C.f,'orange'],['p',C.p,'purple'],['ε',C.eps,'teal'],['k∞',C.kinf,'gold'],['k_eff',C.keff,C.keff>=1?'green':'red']];
          fac.forEach(([n,val,col],i)=>{const x=.9*i+.475;s.rect(.9*i+.15,0,.9*i+.8,val,{fill:col,fillAlpha:.55,color:col});s.text(n,x,-.16,{size:13,weight:700,color:col,align:'center'});s.text(v.fix(val,3),x,val+.1,{size:12,weight:700,color:'ink',align:'center'});});
          s.hline(1,{color:'ink',dash:true,alpha:.6});s.text('k = 1',5.3,1.07,{size:11,color:'muted',align:'right'});
          const cx=g=>.4+g*9.2/9;
          layers.forEach(lay=>lay.forEach((nd,i)=>{nd.y=(i+.5)/lay.length;}));
          layers.forEach((lay,g)=>{
            const shown=Math.min(60,lay.length);
            for(let j=0;j<shown;j++){
              const nd=lay[Math.floor((j+.5)*lay.length/shown)];
              if(g>0)s2.line(cx(g-1),layers[g-1][nd.par].y,cx(g),nd.y,{color:'faint',width:1});
              s2.dot(cx(g),nd.y,{r:lay.length>30?2.5:4.5,color:g===0?'gold':'accent'});
            }
            s2.text(`g${g}`,cx(g),-.09,{size:10.5,color:'muted',align:'center'});
          });
          const extinct=layers.findIndex(lay=>!lay.length);
          if(extinct>=0)s2.text(`lineages extinct by g${extinct}`,5,.65,{size:12,weight:700,color:'red',align:'center'});
          s2.text(`four sources; Poisson(${f2(v,C.keff)}) offspring`,.1,1.2,{size:11,color:'muted',align:'left'});
          s2.text('up to 60 visible per generation',.1,1.1,{size:11,color:'muted',align:'left'});
        });
        v.readout(()=>{
          const k=C.keff,survival=poissonSurvivalAudit(k),note=k<1?'subcritical mean':k===1?'critical mean':'supercritical mean';
          return `$k_\\infty=${v.fix(C.kinf,3)}$, $k_{\\rm eff}=${v.fix(k,3)}$: ${note}. ${MOD[mod.value].lab}.\nFull simulated population at generation 9: $${layers[9].length}$; expected population from four sources: $4k^9=${v.sci(4*k**9,3)}$.\nInfinite-process survival probability: ${(100*survival).toFixed(2)}% from one source, ${(100*(1-(1-survival)**4)).toFixed(2)}% from four. These probabilities concern the unbounded Poisson model, not survival through only nine generations.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7', kind: 'Concept', name: 'Delayed neutrons make reactors controllable',
      statement: String.raw`Most fission neutrons appear promptly, but thermal U-235 fission produces about 0.65% as **delayed neutrons** following precursor beta decay. In a point-kinetics model, a positive reactivity $\rho=(k-1)/k$ below $\beta$ is **delayed supercritical** while the prompt population alone remains subcritical. The delayed groups then substantially slow sustained growth. At $\rho=\beta$ the model is **prompt critical**; above it, growth can become much faster. The exact period still follows the inhour equation and depends on the distance above threshold and on $\Lambda$, not a universal millisecond rule.`,
      idea: String.raw`The six groups contribute an additional low-reactivity time scale $\sum_i\beta_i/\lambda_i$. For small positive $\rho$, expanding the inhour equation gives $\omega\approx\rho/(\Lambda+\sum_i\beta_i/\lambda_i)$. This is a small-reactivity approximation, not the period at arbitrary reactivity. The conditional mean precursor delay is $\sum_i\beta_i/\lambda_i\,/\,\beta$. At larger reactivity solve $\rho=\Lambda\omega+\sum_i\beta_i\omega/(\omega+\lambda_i)$ directly. A finite prompt relaxation precedes the approximate jump $\beta/(\beta-\rho)$; the approximation deteriorates near prompt criticality.`,
      caption: String.raw`Compare a synthetic six-group model (blue) with the counterfactual $\beta=0$ model at the **same reactivity** (red), starting at unit power. Time and power use logarithmic axes. Curves end when they reach the displayed power ceiling. Crossing one dollar does not make the blue and red curves coincide. Green is the sub-prompt-critical jump approximation; gold is the exact inhour period when it lies in the time window.`,
      deps: ['energy-3.6'],
      refs: ['DOE-HDBK-1019/1-93, NP-02 pp. 29–32 and Table 3 (delayed groups and neutron generation time)', 'Tester ch. 9'],
      links: {primary:'https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1019-93_VOL1.pdf'},
      tags: ['delayed neutrons', 'reactor control', 'reactor period'],
      scope: String.raw`Read the complete relevant DOE “Prompt and Delayed Neutrons” section and Table 3. The six printed fractions sum to 0.00649, rounding to the table's 0.0065 total; decay constants are $\ln2/t_{1/2}$ from its six half-lives. No unread 1957 paper is claimed as the numerical source. The model treats those fractions as effective kinetics coefficients, omitting spatial/energy importance weighting and fuel evolution. The prompt-only comparison sets $\beta=0$; it does not model physically removing delayed neutrons from the same fuel. Zero-power, constant-reactivity, initially critical conditions; no feedback, spatial shape change or thermal evolution.`,
      credit: 'Six-group data: US Department of Energy, DOE-HDBK-1019/1-93 Table 3',
      verify: false,
      viz(v) {
        const s = v.stage({ x: [1e-4, 100], y: [0.5, 1e6], xlog: true, ylog: true, axes: 'box', gutter: true, height: 350, xlabel: 'time since the step (s)', ylabel: 'power relative to initial', minWidth: 340 });
        const sb = v.stage({ x: [0, 7], y: [0, 1], axes: false, height: 350, minWidth: 300 });
        const rho = v.slider('reactivity step $\\rho$ (dollars, $\\$1=\\beta$)', 0.05, 1.3, 0.34, { step: 0.01 });
        const Lam = v.slider('prompt generation time $\\Lambda$ (s)', 1e-5, 1e-3, 1e-4, { log: true });
        const ts = Array.from({ length: 70 }, (_, i) => 1e-4 * 10 ** (6 * i / 69));
        let res = null;
        v.render(() => {
          const L = Lam.value, r = rho.value * BETA;
          const del = kinStepCurveAudit(v.M,r,L,ts);
          const omega = inhour(v.M, r, L), jump = r < BETA ? BETA / (BETA - r) : null;
          const endPrompt=Math.min(100,Math.log(1e6)*L/r),pr=ts.filter(t=>t<endPrompt).map(t=>[t,Math.exp(r*t/L)]);pr.push([endPrompt,Math.min(1e6,Math.exp(r*endPrompt/L))]);
          s.clip(() => { s.path(pr, { color: 'red', width: 2.2 }); s.path(del, { color: 'accent', width: 2.6 }); });
          if (jump) s.hline(jump, { color: 'green', dash: true, alpha: 0.7 });
          if (omega > 0 && 1/omega>=1e-4 && 1/omega<=100) s.vline(1 / omega, { color: 'gold', dash: true, alpha: 0.7 });
          s.hline(1, { color: 'faint' });
          if (jump) s.text(`prompt jump ${f2(v, jump)}`, 2e-4, jump * 1.6, { size: 11.5, color: 'green', align: 'left' });
          if (omega > 0 && 1/omega>=1e-4 && 1/omega<=100) s.text(`1/ω = ${v.fmt(1 / omega, 3)} s`, 1 / omega / 1.15, 3, { size: 11.5, color: 'gold', align: 'right' });
          res = { omega, jump, tPrompt: r > 0 ? L / r : Infinity, r };
          // delayed groups bar chart
          const mx = Math.max(...DN_BETA);
          sb.text('delayed-neutron groups (U-235, thermal)', 0.1, 0.96, { size: 12, weight: 700, color: 'ink', align: 'left' });
          DN_BETA.forEach((b, i) => { const x0 = i + 0.6; sb.rect(x0 - 0.3, 0.12, x0 + 0.3, 0.12 + 0.55 * b / mx, { fill: 'orange', fillAlpha: 0.55, color: 'orange' });
            sb.text(`${(b * 1e5).toFixed(0)}`, x0, 0.12 + 0.55 * b / mx + 0.05, { size: 11, weight: 700, color: 'ink', align: 'center' });
            sb.text(`${f2(v, Math.LN2 / DN_LAM[i])} s`, x0, 0.05, { size: 10.5, color: 'muted', align: 'center' }); });
          sb.text('bars: β_i in pcm (10⁻⁵); labels: half-life', 0.1, 0.85, { size: 11, color: 'muted', align: 'left' });
          sb.text(`total β = ${BETA.toFixed(4)}   mean delay ${f1(v, DN_BETA.reduce((a, b, i) => a + b / DN_LAM[i], 0) / BETA)} s`, 0.1, 0.78, { size: 12, weight: 700, color: 'orange', align: 'left' });
        });
        v.legend([['accent', 'with delayed neutrons'], ['red', 'prompt neutrons only'], ['green', 'prompt jump $\\beta/(\\beta-\\rho)$', { dash: true }], ['gold', 'stable period', { dash: true }]]);
        v.readout(() => {
          const lam = DN_BETA.reduce((a, b, i) => a + b / DN_LAM[i], 0), T = res.omega > 0 ? 1 / res.omega : Infinity;
          return `$\\rho=${f2(v, rho.value)}\\,\\$ = ${v.fix(res.r * 1e5, 0)}$ pcm. Prompt-only e-folding time $\\Lambda/\\rho = ${v.fmt(res.tPrompt, 3)}$ s; with delayed neutrons the stable period is $1/\\omega = ${v.fmt(T, 3)}$ s (inhour equation), ${v.fmt(T / res.tPrompt, 3)} times slower.\nSmall-reactivity time scale $\\Lambda+\\sum\\beta_i/\\lambda_i = ${v.fmt(Lam.value + lam, 3)}$ s versus $\\Lambda = ${v.fmt(Lam.value, 2)}$ s. ${rho.value >= 1 ? '**At or above prompt critical: the jump approximation is unavailable; the exact period still follows the inhour equation.**' : `Prompt jump factor $\\beta/(\\beta-\\rho) = ${f2(v, res.jump)}$.`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.8
    {
      num: '3.8', kind: 'Model', name: 'Point reactor kinetics',
      statement: String.raw`For a reactor treated as a single point, the neutron population $n(t)$ (relative power) and the concentrations $c_i(t)$ of the six delayed-neutron precursor groups obey
$$\frac{dn}{dt} = \frac{\rho(t)-\beta}{\Lambda}\,n + \sum_{i=1}^{6}\lambda_i c_i,\qquad \frac{dc_i}{dt} = \frac{\beta_i}{\Lambda}\,n - \lambda_i c_i,$$
with $\beta=\sum\beta_i$. For constant $\rho$ this is a linear system $\dot y = A y$ with 7 eigenvalues, and the largest, $\omega$, is the root of the inhour equation $\rho = \Lambda\omega + \sum_i \beta_i\omega/(\omega+\lambda_i)$. For $0<\rho<\beta$, a short finite prompt transient is often approximated by the factor $\beta/(\beta-\rho)$, followed by asymptotic growth with period $1/\omega$. Well above prompt critical, when the prompt term dominates, the period approaches $\Lambda/(\rho-\beta)$.`,
      idea: String.raw`Neutron balance: of the $k$ neutrons per generation, a fraction $\beta_i$ is held back in precursor group $i$ and released at rate $\lambda_i$; the rest return within a time $\Lambda$. Because the prompt time is so short, the power adjusts almost instantaneously to the "quasi-static" level $n\approx \beta/(\beta-\rho)$ (the prompt jump) while the precursors slowly catch up. The system is stiff (rates from $0.01$ to $10^{4}$ per second), so we propagate it with the exact matrix exponential $y(t+\Delta t)=e^{A\Delta t}y(t)$, which is exact for constant reactivity. Ramps and feedback require time stepping and an error check; freezing a changing reactivity over a step is an approximation.`,
      caption: String.raw`Choose a reactivity program (step, slow rod withdrawal, or a step followed by a scram) and a size in dollars. The left curve is power on a log scale against time; the dashed lines are the predicted prompt jump and the asymptotic exponential from the inhour equation. Above \$1, the growth rate depends on both $\rho-\beta$ and $\Lambda$; the exact period follows the inhour equation. The optional energy feedback is a schematic negative-feedback law. Runs stop at the stated power ceiling; the readout reports the actual end time.`,
      deps: ['energy-3.7', 'ode-3.1'],
      refs: ['DOE-HDBK-1019/1-93, NP-02 pp. 29–32 and Table 3; six-group balance and inhour derivation shown here', 'Tester ch. 9'],
      links: {primary:'https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1019-93_VOL1.pdf'},
      tags: ['reactor kinetics', 'stiff ODE', 'inhour equation'],
      scope: String.raw`Same inspected DOE six-group inputs as 3.7. The equations assume fixed spatial shape and effective group coefficients; no spatial transport or importance calculation is performed. Constant-reactivity substeps use a matrix exponential. Ramps and the feedback law $\rho=\rho_{\rm external}-\alpha\beta E$, $E=\int n\,dt$, use midpoint freezing and full-step/two-half-step error control (relative power/energy tolerance 0.001); these are numerical approximations. Runs stop at power 10⁵ or the 60 s horizon, and any step-budget truncation is reported. Energy feedback is chosen independently, not calibrated Doppler or coolant physics. There is no core-temperature, material-damage or reactor-safety prediction.`,
      verify: false,
      viz(v) {
        const s = v.stage({ x: [1e-6, 60], y: [0.3, 1e5], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, xlabel: 'time (s)', ylabel: 'power relative to initial', minWidth: 340 });
        const sr = v.stage({ x: [1e-6, 60], y: [-6, 1.6], xlog: true, axes: 'box', gutter: true, height: 340, xlabel: 'time (s)', ylabel: 'reactivity (dollars)', minWidth: 340 });
        const prog = v.select('program', [{ value: 'step', label: 'step' }, { value: 'ramp', label: 'slow ramp (0.02 \\$/s)' }, { value: 'scram', label: 'step, scram at 10 s' }], 'step');
        const rho = v.slider('reactivity $\\rho$ (dollars)', -1, 1.4, 0.3, { step: 0.01 });
        const Lam = v.slider('$\\Lambda$ (s)', 1e-5, 1e-3, 1e-4, { log: true });
        const fb = v.toggle('energy feedback', false);
        const alpha = v.slider('feedback $\\alpha$ (\\$ per full-power second)', 0.005, 0.2, 0.05, { step: 0.005, log: true });
        let sim = null;
        const run = () => {
          sim=kinProgramAudit(v.M,{program:prog.value,dollars:rho.value,Lam:Lam.value,feedback:fb.value,alpha:alpha.value});
        };
        v.render(() => {
          run(); const r = rho.value * BETA;
          const ymax=Math.max(1,...sim.out.map(p=>p[1]))*1.1,ymin=Math.max(1e-6,Math.min(.3,...sim.out.map(p=>p[1]))*.8);s.setView([1e-6,60],[ymin,ymax]);
          const rmin=Math.min(-6,...sim.rr.map(p=>p[1])),rmax=Math.max(1.6,...sim.rr.map(p=>p[1]));sr.setView([1e-6,60],[rmin-.05*(rmax-rmin),rmax+.05*(rmax-rmin)]);
          s.clip(() => s.path(sim.out, { color: 'accent', width: 2.5 }));
          if (prog.value !== 'ramp' && !fb.value && r < BETA && r > 0) s.hline(BETA / (BETA - r), { color: 'green', dash: true, alpha: 0.7 });
          if (prog.value === 'step' && !fb.value && r > 0 && sim.omega > 0) { const tt = 0.5 * sim.out[sim.out.length - 1][0], pt = sim.out.reduce((b, p) => (Math.abs(p[0] - tt) < Math.abs(b[0] - tt) ? p : b)), A = pt[1] / Math.exp(sim.omega * pt[0]); s.clip(() => s.fn((t) => A * Math.exp(sim.omega * t), { color: 'gold', dash: true, width: 1.8, domain: [Math.min(.05,sim.endTime),sim.endTime] })); }
          sr.path(sim.rr, { color: 'purple', width: 2.2 }); sr.hline(0, { color: 'faint' }); sr.hline(1, { color: 'red', dash: true, alpha: 0.7 });
          sr.text('prompt critical ($1)', 0.0015, 1.17, { size: 11, color: 'red', align: 'left' });
        });
        v.legend([['accent', 'power $n(t)$'], ['green', 'prompt jump', { dash: true }], ['gold', 'inhour asymptote', { dash: true }], ['purple', 'net reactivity'], ['red', 'prompt critical', { dash: true }]]);
        v.readout(() => {
          const r = rho.value * BETA, pk = Math.max(...sim.out.map((p) => p[1])), end = sim.out[sim.out.length - 1][1];
          const jump = prog.value !== 'ramp' && !fb.value && r < BETA ? `predicted prompt jump $\\beta/(\\beta-\\rho)=${f2(v, BETA / (BETA - r))}$, ` : '';
          const per = sim.omega > 0 && prog.value === 'step' && !fb.value && r > 0 ? `stable period $1/\\omega = ${v.fmt(1 / sim.omega, 3)}$ s (inhour), ` : '';
          return `${jump}${per}peak power $${v.sci(pk, 3)}$ of initial, power at ${v.fmt(sim.endTime,3)} s $${v.sci(end, 3)}$. Run ${sim.reason}.\nEnergy released $${v.sci(sim.E, 3)}$ full-power seconds. ${rho.value >= 1 && !fb.value && prog.value === 'step' ? '**Prompt-supercritical constant-reactivity growth; the run stops at the displayed power ceiling.**' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.9
    {
      num: '3.9', kind: 'Phenomenon', name: 'Decay heat after shutdown',
      statement: String.raw`Stopping a fission chain does not remove the radioactive products accumulated during operation. Their decays continue to release heat. A specific historical illustration is the empirical natural-uranium fit of Untermyer and Weills (1952, Eq. 2): after constant-power operation for $T$ seconds, the fractional heat at $t$ seconds after shutdown is
$$f(t,T)=\frac{P(t)}{P_0}=0.1\{g(t)-g(t+T)\},$$
$$g(t)=(t+a)^{-0.2}-0.87(t+b)^{-0.2},$$
with $a=10$ and $b=2\times10^7$. All times in this fitted expression are numerical values in seconds. Its heat includes fission products and U-239/Np-239 decay. It demonstrates why power history and time since shutdown matter; it is not a universal modern fuel-inventory calculation. Even 1% of 3000 MW(th) is 30 MW.`,
      idea: String.raw`For one radioactive species, $N(t)=N(0)e^{-\lambda t}$ and heat production is proportional to $\lambda N(t)$. Many species spread across many decay times can produce an approximate power-law envelope. Under steady irradiation, the older and younger products build up to different extents; this is why the empirical heat expression subtracts the response at $t+T$. The water illustration follows energy conservation: first $mc_p(100-40)$ warms the inventory, then each evaporated kilogram requires the latent heat. Water mass remains constant during the initial warming phase.`,
      caption: String.raw`Change the operating history, power and water inventory; drag the gold handle to choose when cooling is lost. The blue curve uses the original 1952 fit, while grey shows the same fit after 10 days of operation. The water panel follows up to 100 hours, stopping if exhausted, starting at 40°C: a flat segment precedes boiling. If the inventory is not exhausted within that window, the readout reports the amount remaining.`,
      deps: ['energy-3.6'],
      refs: ['Untermyer & Weills, Heat Generation in Irradiated Uranium, AECD-3454 (1952), pp. 3–5 and original appendices', 'IAPWS-IF97 saturated water reference at 100°C; constant liquid heat capacity is illustrative'],
      links: {primary:'https://digital.library.unt.edu/ark:/67531/metadc1016891/m2/1/high_res_d/4376281.pdf'},
      tags: ['decay heat', 'nuclear safety', 'fission products'],
      credit: 'Original empirical fit: S. Untermyer and J. T. Weills, Argonne National Laboratory (1952)',
      scope: String.raw`Read the complete original 24-page report, including the experimental and summation appendices; the plotted fit is its Eq. 2, not an unread original Way–Wigner formula. The report's natural-uranium curves refer to conversion ratio about 0.8. Delayed-neutron fission is excluded. Its stated historical uncertainties are ±50% at 1–100 s, ±30% at 100–10⁴ s, ±10% at 10⁴–10⁶ s and ±50% at 10⁶–10⁸ s. The displayed decay times are 10 s–100 days; the water window extends at most 100 h beyond the selected time, still below 10⁸ s. The fit is not current decay-heat design data or a safety calculation. Water is a perfectly mixed, adiabatic, unpressurized inventory with chosen constant $c_p=4186$ J/(kg K), warming from 40 to 100°C, then evaporating at the 100°C saturation reference ($h_{fg}\approx2256.5$ kJ/kg). It neglects metal/fuel heat capacity, pressure changes, makeup, condensation and other heat transfer. No particular accident or actual core-uncover time is inferred.`,
      verify: false,
      viz(v) {
        const s=v.stage({x:[6,1.4e7],y:[1e-5,.1],xlog:true,ylog:true,axes:'box',gutter:{r:24},height:320,xlabel:'time after shutdown',ylabel:'decay heat / operating power',minWidth:340,
          xticks:[[10,'10 s'],[60,'1 min'],[600,'10 min'],[3600,'1 h'],[86400,'1 d'],[864000,'10 d'],[8.64e6,'100 d']]});
        const sl=v.stage({x:[0,100],y:[-5,105],axes:'box',gutter:{r:24},height:320,xlabel:'hours after cooling is lost',ylabel:'water left (%)',minWidth:340});
        const P0=v.slider('thermal power (MW)',100,4000,3000,{step:50});
        const Top=v.slider('operating time (days)',10,1500,365,{log:true});
        const inv=v.slider('water inventory (tonnes)',20,600,150,{step:5});
        const h=s.handle(3600,decayFractionAudit(3600,365*86400),{color:'gold',constrain:x=>{x=clamp(x,10,8.64e6);return[x,decayFractionAudit(x,Top.value*86400)];}});
        const HFG=(satT(100).hg-satT(100).hf)*1000;
        let B;
        v.render(()=>{
          const T=Top.value*86400;h.set(h.x,decayFractionAudit(h.x,T));
          s.fn(t=>decayFractionAudit(t,10*86400),{domain:[10,8.64e6],color:'muted',width:1.5,dash:true});
          s.fn(t=>decayFractionAudit(t,T),{domain:[10,8.64e6],color:'accent',width:2.6});
          s.textPx('cooling lost',clamp(s.X(h.x),s.X(10)+42,s.X(8.64e6)-42),s.Y(h.y)-13,{size:11,color:'gold',align:'center'});
          s.hline(.01,{color:'faint',dash:true});s.text('1 %',12,.012,{size:11,color:'muted',align:'left'});
          B=decayWaterAudit({t0:h.x,T,powerMW:P0.value,massKg:inv.value*1000,latent:HFG});
          sl.setView([0,B.dryTime===null?100:Math.max(.05,B.dryTime/3600*1.15)],[-5,105]);
          sl.path(B.points,{color:'accent',width:2.6});
          if(B.boilTime!==null){sl.dot(B.boilTime/3600,100,{r:4,color:'orange'});sl.textPx('boiling starts',clamp(sl.X(B.boilTime/3600),sl.X(0)+52,sl.X(sl.bounds.x[1])-52),sl.Y(100)+15,{size:11,color:'orange',align:'center'});}
          if(B.dryTime!==null){sl.dot(B.dryTime/3600,0,{r:4,color:'red'});sl.textPx('inventory exhausted',clamp(sl.X(B.dryTime/3600),sl.X(0)+68,sl.X(sl.bounds.x[1])-68),sl.Y(0)-13,{size:11,color:'red',align:'center'});}
        });
        v.legend([['accent','selected operating history'],['muted','10 days operation',{dash:true}],['orange','sensible warming complete',{dot:true}]]);
        v.readout(()=>{
          const T=Top.value*86400,f=decayFractionAudit(h.x,T),P=f*P0.value;
          const state=B.dryTime!==null?`Inventory exhausted after ${v.fmt(B.dryTime/3600,3)} h in this model.`:`After 100 h: ${f1(v,B.left/1000)} t (${f1(v,100*B.left/(inv.value*1000))}%) remain; exhaustion is not reached within the window.`;
          const warm=B.boilTime===null?'Water has not yet reached boiling within 100 h.':`Boiling starts after ${v.fmt(B.boilTime/3600,3)} h; no mass is removed before then.`;
          return `${v.fmt(h.x/3600,3)} h after shutdown: fitted heat ${v.fix(100*f,3)}% of operating power = ${f1(v,P)} MW. Its saturated-water evaporation equivalent is ${f1(v,P*1e6/HFG)} kg/s; the initially cool water must warm first.\n${warm} ${state} Heat admitted by the stopping time: ${v.fmt(B.energy/1e9,4)} GJ. This is an idealized energy balance, not a reactor safety prediction.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.10
    fusionErratumItem,
  ],
};
