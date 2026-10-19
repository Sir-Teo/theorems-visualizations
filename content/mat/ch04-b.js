// Materials Science — Chapter 4, part b: items 4.5–4.8 (Hollomon's law, Hall–Petch, inverse Hall–Petch, solid-solution strengthening)
import { TENSILE_PRESETS, epsOfSigma, sigmaOfEps, considereSigma, sig } from './ch04.shared.js';

import { powerLawPeak, tangentStressRatio, fitLogPower } from './source-audit-tensile-fit.shared.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

import { grainSets as HP, grainTaylorFactor as TAYLOR, grainYield as hpYield, asymptoticPile as pileCount, fittedPile, competingStrength, cubicBoundaryFraction, closestCell } from './source-audit-grain-strength.shared.js';

import { makeField, rampLine, friedelStress } from './source-audit-solute-line.shared.js';

export default {
  collection: 'mat',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Law',
      name: 'Hollomon’s strain-hardening law',
      statement: String.raw`A **Hollomon power law** approximates true stress over a chosen plastic-strain range: $\sigma=K\varepsilon_p^n$, with $K>0,n>0$. It is empirical, and contains no finite elastic yield interval. Its log–log slope is n. With negligible elastic strain and uniform constant-volume extension, the force maximum is at $\varepsilon_p=n$ and nominal stress $Kn^ne^{-n}$. If this bar model instead retains $\varepsilon=\varepsilon_p+\sigma/E$ while using $A=A_0e^{-\varepsilon}$, its force maximum satisfies $$\frac{\varepsilon_p}{n}+\frac{K\varepsilon_p^n}{E}=1.$$ Thus $\varepsilon_p=n$ is a limiting approximation, not the exact finite-E prediction.`,
      idea: String.raw`For the chosen area convention, nominal stress is $S=K\varepsilon_p^n\exp[-\varepsilon_p-K\varepsilon_p^n/E]$. Its derivative changes sign where $\varepsilon_p/n+\sigma/E=1$. The left side increases from0, giving a unique maximum at $0<\varepsilon_p<n$. Equivalently the total-strain tangent ratio $(d\sigma/d\varepsilon)/\sigma=n/[\varepsilon_p+n\sigma/E]$ crosses1. The readout compares this corrected prediction with the generating model. A least-squares line in log stress versus log plastic strain estimates n and K; a finite noisy window may shift the fit. The reported slope standard error is a conditional regression statistic, not uncertainty in material physics.`,
      caption: String.raw`Dots are synthetic positive stress samples from a power law at known plastic strains, with seeded stress noise. The four parameter sets are illustrative rather than measurements of named metals. Window sliders select the points in the log fit; reverse or sparse windows give no fit. The right graph shows the fitted total-tangent/stress ratio and its crossing of1, including the retained elastic strain. The gold marker is the exact maximum of the generating bar model. Resample changes only the seeded synthetic noise.`,
      deps: ['mat-4.4'],
      refs: ['Lubliner, Plasticity Theory §2.1.2, pp80–82, Eqs.(2.1.1)–(2.1.3)', 'Bower, Applied Mechanics of Solids §3.7.5'],
      tags: ['strain hardening', 'power law', 'tensile test'],
      scope: String.raw`Lubliner, Plasticity Theory, §2.1.2 pp80–82, especially Eqs.(2.1.1)–(2.1.3) and the complete ultimate-tensile-strength argument; Bower §3.7.5 for empirical plastic-strain hardening functions. No original1945 priority or measured metal constants are newly asserted. Uniform uniaxial response and A=A₀exp(−total true strain) are assumed. Combining that geometric incompressibility with a linear axial elastic term is an illustrative bar convention, not a complete finite-strain elastic model. Neither the power law nor a log fit validates post-necking tensile data. Synthetic input strain is known; the formal regression error does not include measurement errors in strain.`,
      viz(v) {
        const sets=TENSILE_PRESETS.map((m,i)=>({...m,label:`synthetic set ${'ABCD'[i]} (n=${m.n})`}));
        const matS = v.select('synthetic parameters', sets.map(p=>({value:p.id,label:p.label})), 'steel');
        const lo=v.slider('fit from plastic strain',.002,.05,.004,{log:true,decimals:4}),hi=v.slider('fit up to plastic strain',.02,.5,.5,{log:true,decimals:3}),noise=v.slider('stress noise (%)',0,3,1,{step:.1});
        let seed=7,info=null;v.button('resample',()=>{seed++;});
        const A=v.stage({x:[.001,.6],y:[10,1000],xlog:true,ylog:true,axes:'box',gutter:{l:72},height:360,weight:1.1,xlabel:'known plastic strain',ylabel:'synthetic true stress (MPa)',title:'log–log power-law fit'});
        const B=v.stage({x:[.002,.55],y:[.01,100],ylog:true,axes:'box',gutter:{l:72},height:360,weight:1,xlabel:'plastic strain',ylabel:'total tangent / true stress',title:'force maximum: ratio crosses 1'});
        v.render(()=>{
          const m=sets.find(p=>p.id===matS.value),E=m.E*1000,K0=m.s0/.002**m.n,peak=powerLawPeak(K0,m.n,E),r=v.rng(seed),data=[];
          for(let i=0;i<32;i++){const ep=Math.exp(Math.log(.0025)+(Math.log(.97*peak.plastic)-Math.log(.0025))*i/31),sg=K0*ep**m.n*(1+noise.value/100*r.normal());if(sg>0)data.push({ep,s:sg});}
          const selected=fitLogPower(data,lo.value,hi.value),fit=selected.fit,valid=fit&&fit.n>0&&fit.K>0,pred=valid?powerLawPeak(fit.K,fit.n,E):null;
          const vals=data.map(p=>p.s);if(valid)vals.push(fit.K*.001**fit.n,fit.K*.6**fit.n);
          A.setView([.001,.6],[Math.min(...vals)*.8,Math.max(...vals)*1.2]);
          for(const p of data){const on=p.ep>=lo.value&&p.ep<=hi.value;A.dot(p.ep,p.s,{r:on?4.5:3.5,color:on?'accent':'faint',fill:on?'accent':'faint'});}
          A.vline(lo.value,{color:'orange',dash:true});A.vline(hi.value,{color:'orange',dash:true});
          const xmax=Math.max(.55,pred?pred.plastic*1.2:0),xmin=.002;
          if(valid){A.fn(x=>fit.K*x**fit.n,{domain:[.001,.6],color:'green',dash:true,width:1.5});A.fn(x=>fit.K*x**fit.n,{domain:[lo.value,hi.value],color:'green',width:3});}
          const ratio=valid?p=>tangentStressRatio(p,fit.K,fit.n,E):null,ys=valid?[ratio(xmin),ratio(xmax)]:[.1,10];
          B.setView([0,xmax],[Math.min(.5,...ys)*.8,Math.max(2,...ys)*1.2]);B.hline(1,{color:'orange',width:2});
          if(valid){B.fn(ratio,{domain:[xmin,xmax],color:'green',width:2.5});B.dot(pred.plastic,1,{r:6,color:'red',fill:'red'});B.vline(pred.plastic,{color:'red',dash:true});}
          B.dot(peak.plastic,1,{r:9,color:'gold',hollow:true,width:2});
          info={fit,count:selected.count,peak,pred,E,K0,m};
        });
        v.legend([['accent','synthetic samples in window'],['green','log fit / total tangent ratio'],['orange','ratio = 1'],['red','fitted model maximum'],['gold','generating model maximum']]);
        v.readout(()=>{
          if(!info.fit)return lo.value>=hi.value?'Reversed fit window: choose lower < upper.':'Fewer than three positive points in the fit window: widen it.';
          const{fit,pred,peak,count}=info;let out=`Seed ${seed}: ${count} samples; fitted n=${v.fix(fit.n,4)}, K=${v.fix(fit.K,2)} MPa. Formal log-OLS slope standard error=${v.fix(fit.se,4)}, R²=${fit.r2===null?'unidentified (constant log stress)':v.fix(fit.r2,4)}.`;
          if(!pred)return out+' Nonpositive fitted exponent: no monotone power-law necking prediction.';
          out+=`\nFinite-E bar prediction: plastic strain ${v.fix(pred.plastic,5)}, total strain ${v.fix(pred.total,5)}, nominal maximum ${v.fix(pred.nominal,2)} MPa. Neglecting elasticity gives plastic strain n=${v.fix(fit.n,5)} and nominal maximum ${v.fix(fit.K*fit.n**fit.n*Math.exp(-fit.n),2)} MPa.\nGenerating model plastic strain at maximum=${v.fix(peak.plastic,5)}. The fit uses synthetic data, not an experimental calibration.`;return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Law',
      name: 'Hall–Petch relation',
      statement: String.raw`The **Hall–Petch relation** empirically describes grain-size strengthening over a material-dependent regime: $\sigma_y=\sigma_0+k_y/\sqrt d$. The intercept and slope depend on the material state, temperature and testing conditions; σ₀ is an extrapolated intercept, not automatically a measured single-crystal yield stress. The inverse-square-root trend is not unlimited or universally valid below a fixed grain size. Pile-ups provide one mechanistic explanation, but other dislocation arrangements can produce the same exponent.`,
      idea: String.raw`For a straight-edge pile-up of length L, $n\simeq\pi(1-\nu)\tau L/(Gb)$ at large n. A locked head supports the total reaction $n\tau$ in stress units. If a neighbouring source activates at a fixed critical head stress, $n\tau=\tau_c$ gives $\tau\propto L^{-1/2}$. This is a conditional model. Here L=d/2 and an assumed factor M=3.06 converts the tensile excess to shear. For the discrete drawing, x₀=0 is locked and each mobile position solves $\sum_{k\ne j}(x_j-x_k)^{-1}=1$ in length units $a_*=Gb/[2\pi(1-\nu)\tau]$. The calculation finds the largest count fitting L and checks its residual; one locked head is assumed even where a many-dislocation pile-up makes little physical sense.`,
      caption: String.raw`Change the grain size by slider or graph handle. Parameter sets are synthetic choices, not measured metal constants. The drawing uses the discrete straight-line force balance in a band of length d/2. At large counts, every second or later symbol is shown to keep the display legible; the readout reports the full count. The line is the assumed Hall–Petch law, including the smallest available grain size. It does not establish an experimental validity range.`,
      deps: ['mat-3.10', 'mat-4.3'],
      refs: ['Bhadeshia–Chintha (2022), §2, Eqs.(1a)–(1d), author pp2–3; DOI:10.1080/02670836.2022.2079295', 'Lubliner, Plasticity Theory §2.2.2 p102'],
      tags: ['grain size', 'strengthening', 'pile-up'],
      scope: String.raw`Primary author treatment: Bhadeshia–Chintha, Critical assessment: the strength of undeformed pearlite (2022), §2 opening treatment and Eqs.(1a)–(1d), author-manuscript pp2–3; Lubliner§2.2.2 p102. The former explicitly notes that ideal pile-ups often are not observed and distinguishes alternative mechanisms. The present numerical geometry is one isotropic straight-edge, locked-head model, not a reproduction of pearlite data. Parameters and M are illustrative assumptions. The continuum count is asymptotic; the discrete count is conditioned on the assumed prepared head, pair law and finite band. No universal grain-size cutoff or original-paper priority is asserted.`,
      viz(v) {
        const matS = v.select('synthetic parameter set', HP.map((p) => ({ value: p.id, label: p.label })), 'B');
        const dS = v.slider('grain size $d$ ($\\mu$m)', 0.05, 100, 10, { log: true, decimals: 2 });
        const A = v.stage({ x: [-0.62, 0.62], y: [-0.62, 0.62], equal: true, axes: false, height: 320, weight: 1.1, title: 'one grain, in units of $d$' });
        const B = v.stage({ x: [0, 4.2], y: [0, 400], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: '$d^{-1/2}$  ($\\mu$m$^{-1/2}$)', ylabel: 'yield strength (MPa)', title: 'Hall–Petch plot' });
        const hB = B.handle(0.5, 100, { color: 'accent', r: 8, constrain: (x) => { const t = clamp(x, 0.1, 1/Math.sqrt(.05)); return [t, hpYield(HP.find((p) => p.id === matS.value), 1 / (t * t))]; } });
        hB.onDrag = () => dS.set(clamp(1 / (hB.x * hB.x), 0.05, 100));
        let info = null;
        v.render(() => {
          const m = HP.find((p) => p.id === matS.value), d = dS.value, dM = d * 1e-6;
          const sy = hpYield(m, d), tauPa = (m.k * 1e6) / Math.sqrt(dM) / TAYLOR, tau = tauPa / 1e6, a = (m.G * 1e9 * m.b * 1e-9) / (2 * Math.PI * (1 - m.nu) * tauPa), L = dM / 2, nCont = pileCount(m, dM);
          const certificate=fittedPile(L/a), n=certificate.n, xs=certificate.positions, stride=Math.max(1,Math.ceil(n/60));
          // grain: hexagon of width 1, boundary highlighted
          const R = 0.5 / Math.cos(Math.PI / 6), hex = [0, 1, 2, 3, 4, 5].map((i) => [R * Math.cos(Math.PI / 6 + (Math.PI / 3) * i), R * Math.sin(Math.PI / 6 + (Math.PI / 3) * i)]);
          A.poly(hex, { fill: 'accent', fillAlpha: 0.07, color: 'ink', width: 2.5 });
          A.line(0.5, R / 2, 0.5, -R / 2, { color: 'red', width: 4, alpha: 0.9 });
          A.line(-0.5, 0, 0.5, 0, { color: 'faint', dash: true });
          A.dot(0, 0, { r: 7, color: 'gold', fill: 'gold', label: 'source', labelPos: 's' });
          for (let j = 0; j < n; j += stride) {
            const x = 0.5 - (xs[j] * a) / dM;
            A.tex('\\perp', x, 0.035, { color: 'orange', size: 16 });
          }
          A.arrow(-0.12, 0.2, 0.12, 0.2, { color: 'muted', head: 6 }); A.text('$\\tau$', 0, 0.28, { color: 'muted', size: 13 });
          A.text('grain boundary', 0.5, -R / 2 - 0.06, { color: 'red', size: 11.5, align: 'right' });
          // plot
          const xm = 1 / Math.sqrt(d);
          const xmax=1/Math.sqrt(.05)*1.04; B.setView([0,xmax],[0,hpYield(m,.05)*1.12]);
          B.fn((x) => m.s0 + 1000 * m.k * x, { domain: [0, xmax], color: 'ink', width: 2.5 });
          B.hline(m.s0, { color: 'faint', dash: true }); B.text('$\\sigma_0$', 3.9, m.s0 + 14, { color: 'muted', size: 12, align: 'right' });
          hB.set(xm, sy);
          B.vline(xm, { color: 'accent', alpha: 0.4, dash: true });
          info = { m, d, sy, n, nCont, a, L, tau, certificate, stride };
        });
        v.readout(() => {
          if (!info) return '';
          const {m,d,sy,n,nCont,tau,certificate,stride}=info;
          return `Synthetic d=${v.fmt(d,3)} µm: σy=${v.fix(sy,2)} MPa; assumed excess shear=${v.fix(tau,2)} MPa. Continuum count≈${v.fix(nCont,2)}; discrete count=${n}${certificate.capped?' (search cap)':''}, locked head included. ${stride>1?`Drawing every ${stride}th dislocation.`:'All symbols drawn.'}\nMaximum mobile force residual=${v.fix(certificate.residual,10)}; the next count does not fit the half-grain band. Total head reaction in stress units=${v.fix(n*tau,2)} MPa. ${n<5?'Few-dislocation regime: this does not certify a continuum pile-up strengthening mechanism.':'The pair-force calculation is not a material calibration.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Paradox',
      name: 'Inverse Hall–Petch in nanocrystals',
      statement: String.raw`**Inverse Hall–Petch behaviour** is a decrease of strength with further grain refinement in some nanocrystalline regimes. It is not a universal critical-size law. In their original1998 atomistic copper simulations, Schiøtz, Di Tolla and Jacobsen found small-grain softening dominated by grain-boundary rearrangements, with a smaller contribution from intragranular partials. They stressed preparation and mechanism dependence and did not resolve the crossover to the coarse-grain branch. The interactive model here only illustrates competition between a decreasing Hall–Petch branch and an assumed increasing boundary branch.`,
      idea: String.raw`Set $\sigma_{\rm HP}(d)=\sigma_0+k/\sqrt d$ and $\sigma_{\rm GB}(d)=\sigma_{\rm HP}(d_c)(d/d_c)^m$, with m>0. Their unique intersection is the chosen d_c: the first decreases and the second increases. The lower envelope therefore has its unique maximum there. This algebra does not predict a real material's crossover, grain-boundary constitutive law, temperature dependence or rate sensitivity. Loss of a large pile-up can motivate changing mechanisms, but the threshold n≈1 in the separate pile-up estimate does not determine d_c.`,
      caption: String.raw`Drag along the lower-envelope toy curve or use the grain-size slider. Synthetic parameter sets set the Hall–Petch branch; d_c and m are free assumptions. Dashed inactive branches are shown only up to the graph's upper limit. The middle graph is the separate asymptotic pile-up estimate, not a phase boundary. The right image is a geometric Voronoi mosaic with a chosen seed spacing and a 1nm-wide boundary band. Its area is not an atom fraction or a three-dimensional volume measurement.`,
      deps: ['mat-4.6'],
      refs: ['Schiøtz, Di Tolla, Jacobsen (1998), Nature391,561–563; full author HTML', 'Bhadeshia–Chintha (2022), §2, Eqs.(1a)–(1d)'],
      tags: ['nanocrystals', 'grain boundaries', 'strength'],
      scope: String.raw`Schiøtz–Di Tolla–Jacobsen, Softening of nanocrystalline metals at very small grain sizes, Nature391(1998)561–563, complete original author HTML read. Their actual simulations and preparation dependence are not replaced by the lower-envelope cartoon. No first-report priority, 2003-paper result or measured crossover calibration is asserted. The synthetic sets match those in4.6. The right mosaic uses exact distances to finite Voronoi bisectors. A separate cubic-cell shell estimate, 1−(1−Δ/d)³ for full boundary thickness Δ≤d, is provided only as geometry; its thin-boundary expansion3Δ/d is not used as an exact atom fraction.`,
      viz(v) {
        const matS = v.select('synthetic parameter set', HP.map((p) => ({ value: p.id, label: p.label })), 'B');
        const dcS = v.slider('crossover size $d_c$ (nm)', 5, 100, 15, { log: true, decimals: 1 });
        const mS = v.slider('sliding exponent $m$', 0.2, 1.5, 0.6, { step: 0.05 });
        const dS = v.slider('grain size $d$ (nm)', 3, 10000, 40, { log: true, decimals: 1 });
        const A = v.stage({ x: [3, 10000], y: [0, 1400], xlog: true, axes: 'box', gutter: true, height: 340, weight: 1.3, xlabel: 'grain size $d$ (nm)', ylabel: 'yield strength (MPa)', title: 'strength against grain size' });
        const B = v.stage({ x: [3, 10000], y: [0.01, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: '$d$ (nm)', ylabel: 'dislocations per pile-up', title: 'can a pile-up form?' });
        const C = v.stage({ x: [0, 60], y: [0, 36], equal: true, axes: false, height: 340, weight: 1, minWidth: 250, title: 'geometric mosaic, 60 nm window' });
        const hA = A.handle(40, 500, { color: 'accent', r: 8, constrain: (x) => { const dd = clamp(x, 3, 10000); return [dd, strength(dd).s]; } });
        hA.onDrag = () => dS.set(clamp(hA.x, 3, 10000));
        function strength(dnm) {
          const m=HP.find(p=>p.id===matS.value),q=competingStrength(m,dnm,dcS.value,mS.value);return{hp:q.hp,sl:q.boundary,s:q.value};
        }
        let info = null;
        v.render(() => {
          const m = HP.find((p) => p.id === matS.value), dc = dcS.value, d = dS.value;
          const peak = hpYield(m, dc / 1000), ymax=Math.max(600,peak*1.25);
          A.setView([3, 10000], [0, Math.max(600, peak * 1.25)]);
          A.fn((x) => strength(x).hp, { domain: [Math.max(3,1000*(1000*m.k/(ymax-m.s0))**2), 10000], color: 'accent', width: 2, alpha: 0.5, dash: true });
          A.fn((x) => strength(x).sl, { domain: [3, Math.min(10000,dc*(ymax/peak)**(1/mS.value))], color: 'red', width: 2, alpha: 0.6, dash: true });
          A.fn((x) => strength(x).s, { domain: [3, 10000], color: 'ink', width: 3 });
          A.vline(dc, { color: 'muted', dash: true, alpha: 0.6 }); A.text('$d_c$', dc * 1.06, Math.max(600, peak * 1.25) * 0.05, { color: 'muted', size: 12, align: 'left' });
          A.text('dislocations carry slip', 9000, Math.max(600, peak * 1.25) * 0.8, { color: 'accent', size: 12, align: 'right' });
          A.text('boundaries slide', 5.5, Math.max(600, peak * 1.25) * 0.93, { color: 'red', size: 12, align: 'left' });
          const st = strength(d);
          hA.set(d, st.s);
          // pile-up capacity
          B.fn((x) => pileCount(m, x * 1e-9), { domain: [3, 10000], color: 'orange', width: 2.6 });
          B.hline(1, { color: 'red', dash: true }); B.text('one dislocation', 5, 1.5, { color: 'red', size: 11.5, align: 'left' });
          B.vline(d, { color: 'accent', dash: true, alpha: 0.5 });
          const d1=1/(pileCount(m,1e-9)**2);if(d1>=3&&d1<=10000)B.dot(d1,1,{r:6,color:'red',fill:'red'});
          // polycrystal mosaic: jittered grid seeds of spacing d (nm)
          const gs=Math.max(d,1.2),r=v.rng(11),seeds=[],view=C.bounds;
          const imin=Math.floor(view.x[0]/gs)-2,imax=Math.ceil(view.x[1]/gs)+2,jmin=Math.floor(view.y[0]/gs)-2,jmax=Math.ceil(view.y[1]/gs)+2;
          for(let j=jmin;j<=jmax;j++)for(let i=imin;i<=imax;i++)seeds.push({i,j,x:(i+.5+.7*(r()-.5))*gs,y:(j+.5+.7*(r()-.5))*gs,t:.15+.5*r()});
          C.raster((x,y)=>{const q=closestCell(seeds,x,y);if(!q)return null;if(q.edge<.5)return[...v.rgb('red').slice(0,3),235];const c=v.ramp(seeds[q.index].t,'accent','panel');return[c[0],c[1],c[2],255];},{res:2,key:`${matS.value}|${d.toFixed(3)}|${view.y.join(',')}`});
          info = { m, st, d, d1, frac: cubicBoundaryFraction(d), peak };
        });
        v.legend([['accent', 'Hall–Petch', { dash: true }], ['red', 'boundary sliding', { dash: true }], ['ink', 'toy strength: lower envelope']]);
        v.readout(() => {
          if (!info) return '';
          const { m, st, d, d1, frac } = info;
          const mech = st.hp <= st.sl ? 'dislocation slip (Hall–Petch)' : 'grain-boundary sliding';
          return `Synthetic d=${v.fmt(d,3)} nm: HP=${v.fix(st.hp,2)} MPa, boundary branch=${v.fix(st.sl,2)} MPa; toy lower envelope=${v.fix(st.s,2)} MPa. Chosen maximum=${v.fix(info.peak,2)} MPa at dc=${v.fmt(dcS.value,3)} nm.\nSeparate continuum pile estimate n≈${v.fix(pileCount(m,d*1e-9),2)}; n=1 at ${v.fmt(d1,3)} nm. Cubic-cell boundary-volume estimate=${v.fix(frac*100,1)}% for full thickness1nm. This is not the mosaic's measured atom fraction or a material prediction.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Solid-solution strengthening',
      statement: String.raw`**Solid-solution strengthening** can arise from solute interactions that impede dislocation glide. A dilute isolated-obstacle line-tension approximation gives $L_F\simeq\sqrt{2T/(nf_m)}$ and $$\tau_F\simeq\frac{f_m}{bL_F}=\frac{f_m^{3/2}\sqrt n}{b\sqrt{2T}},$$ where n is obstacle number per area, f_m a force and T a line tension. If the assumed site area is b² and c is dimensionless, n=c/b² and $\tau_F=f_m^{3/2}\sqrt c/(b^2\sqrt{2T})$. Collective weak-pinning models can instead give concentration exponent 2/3. These regimes and prefactors depend on the interaction and population; neither exponent is a universal alloy law.`,
      idea: String.raw`The isolated-pin estimate combines an approximate swept-area condition, a line-tension bow geometry and force balance $\tau bL_F=f_m$; changing the obstacle statistics changes its assumptions. Patinet–Proville's complete analytical treatment gives the site-area factor explicitly in Eq.(1), and the collective alternative in Eq.(2), while showing failures of both for their concentrated atomistic example. Here a single-valued harmonic string follows $\partial_t y=\partial_x^2y+\tau+F_{\rm pin}(x,y)$ in units b=T=mobility=1. A Gaussian attractive potential is normalized so one isolated obstacle exerts peak total force f_m on a long straight string. This is a constructed model, not an atomistic solid solution or calibrated misfit law.`,
      caption: String.raw`The stress slider selects one of 51 stored snapshots from a finite ramp. Every stress increment runs 400 model time units; the timestep menu compares 2 with 1 at the same durations. The response criterion is the first sampled stress where the mean line position exceeds 30b, not a proof that every segment escapes or that no later trap exists. All later snapshots are actually computed. Horizontal and vertical axes use independent scales. The right graph compares five nested seeded fields with the isolated-pin guide and two normalized exponent guides; uncrossed travel criteria appear as open limits, not invented thresholds.`,
      deps: ['mat-2.3', 'mat-3.6'],
      refs: ['Patinet–Proville, Depinning transition for a screw dislocation in a model solid solution (2008), arXiv:0811.0239v1, §§II, III.A–III.B, Eqs.(1)–(2)'],
      tags: ['solid solution', 'strengthening', 'obstacles'],
      scope: String.raw`Primary treatment: Patinet–Proville, arXiv:0811.0239v1, complete analytical §III opening and §§III.A–III.B, pp6–7, Eqs.(1)–(2); relevant full §II read for the meaning of finite simulation criteria and interaction range. No original-priority or measured alloy calibration is asserted. Synthetic point locations fill 0<x<128b, 2b<y<42b, periodic in x only. The numerical potential uses x-distance cutoff 4b. Nominal c sets the rounded obstacle count in the strip; f_m is an integrated straight-line obstacle force, not force per grid node. The semi-implicit finite protocol reports its residual and selected snapshot stress; it does not certify minimization, sustained depinning, an infinite-system threshold, or either concentration exponent from five fields.`,
      verify: false,
      viz(v) {
        const cS=v.slider('nominal obstacle fraction c',.004,.064,.016,{log:true,decimals:4}),fS=v.slider('isolated straight-line force fm/T',.15,1.2,.6,{step:.05}),tS=v.slider('sampled stress / isolated-pin guide',0,2.2,.8,{step:.01});
        const timeStep=v.select('finite timestep',[{value:2,label:'Δt = 2'},{value:1,label:'Δt = 1, twice the steps'}],2);
        let seed=3,ramp=null,sweep=[],gen=0,timer=null,key='',info=null;const CS=[.004,.008,.016,.032,.064];
        const A=v.stage({x:[0,128],y:[-4,44],axes:'box',gutter:{l:68},height:300,full:true,xlabel:'x/b (periodic)',ylabel:'y/b',title:'finite stress-ramp snapshot (independent axis scales)'});
        const B=v.stage({x:[.003,.09],y:[.001,.3],xlog:true,ylog:true,axes:'box',gutter:{l:72},height:300,full:true,xlabel:'nominal obstacle fraction c',ylabel:'stress τb²/T',title:'finite travel criterion versus assumed scaling'});
        const cancel=()=>{gen++;clearTimeout(timer);};v.onCleanup(cancel);
        const plan=()=>{
          cancel();const g=gen,c=cS.value,fm=fS.value,sd=seed,dt=+timeStep.value;ramp=null;sweep=[];
          timer=setTimeout(()=>{if(g!==gen)return;const L=makeField({c,fm,seed:sd});ramp={L,...rampLine(L,50,2.2,dt)};v.invalidate();let j=0;
            const next=()=>{if(g!==gen||j>=CS.length)return;const ck=CS[j++],L=makeField({c:ck,fm,seed:sd}),r=rampLine(L,50,2.2,dt);sweep.push({c:ck,tau:r.tauC,limit:r.taus.at(-1)});v.invalidate();if(j<CS.length)timer=setTimeout(next,5);};timer=setTimeout(next,5);
          },20);
        };
        v.button('new random field',()=>{seed++;key='';});
        v.render(()=>{
          const current=`${cS.value}/${fS.value}/${seed}/${timeStep.value}`;if(current!==key){key=current;plan();}
          if(!ramp){A.text('computing finite ramp…',64,20,{color:'muted'});info=null;}else{
            const target=tS.value*ramp.tF;let index=0;for(let i=1;i<ramp.taus.length;i++)if(Math.abs(ramp.taus[i]-target)<Math.abs(ramp.taus[index]-target))index=i;
            const y=ramp.lines[index],ymax=Math.max(44,...y)+4,ymin=Math.min(-4,...y)-1;A.setView([0,128],[ymin,ymax]);
            for(let k=0;k<ramp.L.ox.length;k++)A.dot(ramp.L.ox[k],ramp.L.oy[k],{r:2.5,color:'orange',fill:'orange'});
            A.path(Array.from({length:ramp.L.N+1},(_,i)=>[i*ramp.L.dx,y[i%ramp.L.N]]),{color:'accent',width:3});A.hline(30,{color:'green',dash:true,alpha:.5});
            info={index,mean:y.reduce((s,x)=>s+x,0)/y.length,residual:ramp.residuals[index],stress:ramp.taus[index]};
          }
          const guide=c=>friedelStress(fS.value,c),valid=sweep.filter(p=>p.tau!==null&&p.tau>0),first=valid[0],vals=[guide(.003),guide(.09),...sweep.map(p=>p.tau??p.limit)];
          const g1=first?c=>first.tau*Math.sqrt(c/first.c):null,g2=first?c=>first.tau*(c/first.c)**(2/3):null;if(first)vals.push(g1(.003),g1(.09),g2(.003),g2(.09));if(ramp)vals.push(ramp.tauC??ramp.taus.at(-1));
          B.setView([.003,.09],[Math.min(...vals)*.7,Math.max(...vals)*1.3]);B.fn(guide,{domain:[.003,.09],color:'ink',width:2});if(first){B.fn(g1,{domain:[.003,.09],color:'green',dash:true,width:1.5});B.fn(g2,{domain:[.003,.09],color:'purple',dash:true,width:1.5});}
          for(const p of sweep)B.dot(p.c,p.tau??p.limit,{r:5.5,color:'accent',fill:p.tau===null?undefined:'accent',hollow:p.tau===null,width:2});
          if(ramp)B.dot(cS.value,ramp.tauC??ramp.taus.at(-1),{r:8,color:'red',hollow:true,width:2});
        });
        v.legend([['accent','finite travel criterion'],['red','current field criterion/limit'],['ink','isolated-pin approximation'],['green','normalized c¹/² guide'],['purple','normalized c²/³ guide']]);
        v.readout(()=>{
          if(!ramp||!info)return'Computing finite ramp…';const{L,tauC,tF}=ramp,valid=sweep.filter(p=>p.tau!==null&&p.tau>0);let exponent=null;if(valid.length>=3){const x=valid.map(p=>Math.log(p.c)),y=valid.map(p=>Math.log(p.tau));exponent=v.M.linreg(x,y).slope;}
          return`Seed ${seed}: ${L.ox.length} obstacles; nominal c=${v.fix(L.c,5)}, actual count/area=${v.fix(L.ox.length/(L.Lx*L.Ly),5)}. Isolated-pin guide=${v.fix(tF,5)} in stress units T/b². ${tauC===null?'Mean travel criterion was not reached: right-censored at '+v.fix(ramp.taus.at(-1),5):'Mean travel 30b first crossed at sampled stress '+v.fix(tauC,5)}.\nSelected snapshot ${info.index}/50: actual stress=${v.fix(info.stress,5)}, mean y=${v.fix(info.mean,3)}b, maximum ODE residual=${v.fix(info.residual,5)}. Δt=${ramp.dt}, ${ramp.iterations} steps per increment. ${info.mean>=30?'Finite mean travel criterion crossed; sustained depinning is not established.':'Finite mean travel criterion has not yet been crossed in this snapshot.'}\n${sweep.length}/5 sweep${sweep.length===5?' complete':''}; ${valid.length} crossed, ${sweep.length-valid.length} censored. ${exponent===null?'No supported exponent fit yet.':'Conditional five-field exponent='+v.fix(exponent,3)+'; this is not an independently validated material exponent.'}`;
        });
      },
    },

  ],
};
