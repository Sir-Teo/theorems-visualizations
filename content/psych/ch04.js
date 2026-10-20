// Psychology & Perception — Chapter 4: Early vision (items 4.1–4.5; 4.6–4.10 are in ch04-b.js, 4.11–4.14 in ch04-c.js)
import { logTicks, grey, clamp01, smooth01, coneDensity, rodDensity, BLIND } from './ch04.shared.js';
import { CIE_PHOTOPIC, CIE_SCOTOPIC, spectralPair, summationCuts } from './source-audit-spectral-summation.js';
import { RETINA_TEMPORAL, retinaX, retinaY, retinaNearest, retinaView, darkAdaptation } from './source-audit-retina.js';

export default {
  collection: 'psych',
  chapter: 4,
  title: 'Early vision: receptors, contrast and lightness',
  summary: String.raw`The retina already processes the image. Two receptor systems trade sensitivity for acuity: cones, packed densely in the fovea, serve daylight and fine detail, while rods, absent from the foveal center and pooled many-to-one, serve the dark. Neighbouring cells then inhibit one another, so that the visual system reports differences, edges and ratios rather than absolute light levels. Lateral inhibition predicts Mach bands and explains some contrast illusions, but the Hermann grid and the lightness illusions show that the account is incomplete and that the brain also reasons about surfaces and illumination. And fixed images fade away: vision is built for change.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num:'4.1',kind:'Concept',name:'Duplex retina: rods and cones',
      statement:String.raw`Human rods and cones have different spatial distributions and roles in vision. Cones are concentrated at the foveal center; rods are absent from its center and become numerous farther out. In Curcio and colleagues' human anatomical study, whole-eye estimates averaged about **4.6 million cones** (range 4.08–5.29 million) and **92 million rods** (78–107 million). These are sample estimates, not universal counts.

The reported mean foveal cone peak was about 199,000/mm², with substantial individual variation. The often-quoted **1.25° rod-free diameter** describes the average horizontal extent inside the study's 1,000-rods/mm² contour. It is not a precisely symmetric, strictly zero-rod disk in every eye or in an interpolated composite. The measured anatomy supports distinct cone-rich central and rod-rich peripheral sampling; receptor counts alone do not predict a person's visibility or acuity.`,
      idea:String.raw`Curcio et al. counted receptors in selected whole-mounted human retinas, reconstructed each distribution and resampled it at common locations before averaging. Fellow eyes counted as one individual. The displayed temporal-meridian data are the authors' archived **composite means**, with seven contributing individuals for central cone values and five for central rod values; the available number decreases toward the periphery. They are not raw microscope counting windows.

A 30-µm square has area $900\,\mu\mathrm m^2=0.0009\,\mathrm{mm}^2$. Multiplying a local density by this area gives an expected count for a uniform patch. The picture rounds each expected count to its nearest integer and supplies an authored layout. In particular, zero rounded icons can coexist with a small positive density. Whole-eye totals are reported separately: integrating this truncated meridian, or a smaller composite retina, cannot reproduce those whole-eye estimates.`,
      caption:String.raw`Choose any of the **28 source locations** with the slider or drag the gold handle, which snaps to those locations. Blue and orange points retain the authors' archived cone and rod means; connecting lines are visual guides. Both axes use $\log_{10}(1+\text{value})$ spacing to retain zero while expanding the central region; tick labels give ordinary degrees and densities.

The 30-µm patch shows nearest-integer counts with **schematic positions and symbol sizes**, not a photomicrograph or a packing model. *Schematic emphasis* dims one receptor type for comparison. It does not simulate lighting, activation, detection or the view through an eye.`,
      deps:[],refs:['Curcio et al. (1990), Human Photoreceptor Topography, methods, Table 3 and Figures 6/9; author archived temporal means'],tags:['retina','rods and cones','sampling'],
      credit:'Christine A. Curcio, Kenneth R. Sloan, Robert E. Kalina and Anita E. Hendrickson (1990), Journal of Comparative Neurology 292:497–523',
      scope:String.raw`The source sample comprises eight retinas from seven individuals aged 27–44; reconstruction, specimen selection and geometric conversion matter. The retained 28 temporal locations span 0–58.7683 visual degrees where both archived means are present. The archived central composite 196,890 cones/mm² and the paper's approximately 199,000 peak summary are separately reported quantities. Missing peripheral values are not zero or extrapolated. Nasal, superior and inferior meridians differ. The illustrative patch is a local uniform-density count calculation, not anatomical coordinates, a clinical measurement or a visibility prediction.`,
      links:{source:'https://christineacurcio.com/PRtopo/',paper:'https://christineacurcio.com/PRtopo/Curcio_JCompNeurol1990_PRtopo_searchable.pdf'},verify: false,
      viz(v){
        const sample=v.slider('retinal location (source sample)',0,27,14,{int:true,fmt:i=>`${i+1}/28: ${RETINA_TEMPORAL[i].degrees.toFixed(5)}°`}),emphasis=v.select('schematic emphasis',[{value:'both',label:'both types'},{value:'cones',label:'emphasize cones'},{value:'rods',label:'emphasize rods'}],'both');
        const A=v.stage({x:[-.12,1.9],y:[-.6,5.65],height:340,minWidth:280,axes:'box',gutter:true,xlabel:'eccentricity (deg; compressed scale)',ylabel:'density (/mm²; compressed scale)',xticks:[0,.5,2,10,50].map(x=>[retinaX(x),String(x)]),yticks:[0,10,100,1000,10000,100000].map(y=>[retinaY(y),y>=1000?`${y/1000}k`:String(y)]),title:'28 archived temporal-meridian means'}),B=v.stage({x:[-2,32],y:[-4,32],equal:true,height:340,minWidth:280,axes:false,title:'authored count diagram: 30-µm square'});
        const h=A.handle(0,-.1,{r:8,color:'gold',constrain:x=>[retinaX(RETINA_TEMPORAL[retinaNearest(x)].degrees),-.1],onDrag:q=>sample.set(retinaNearest(q.x))});
        v.legend([['accent','archived cone means',{dot:true}],['orange','archived rod means',{dot:true}],['gold','selected source location',{dot:true}]]);let info;
        v.render(()=>{const p=retinaView(sample.value,emphasis.value);A.path(p.coneCurve,{color:'accent',width:2});A.path(p.rodCurve,{color:'orange',width:2});for(const[x,y]of p.coneCurve)A.dot(x,y,{r:2.5,color:'accent',ring:false});for(const[x,y]of p.rodCurve)A.dot(x,y,{r:2.5,color:'orange',ring:false});const x=retinaX(p.degrees);h.set(x,-.1);A.dot(x,retinaY(p.cones),{r:5,color:'accent'});A.dot(x,retinaY(p.rods),{r:5,color:'orange'});B.rect(0,0,30,30,{fill:'panel',fillAlpha:1,color:'muted',width:1});for(const c of p.cells)B.dot(c.x,c.y,{r:c.cone?4:2.2,color:c.cone?'accent':'orange',alpha:c.alpha,ring:false});B.text(`${p.coneCount} cones + ${p.rodCount} rods (rounded)`,15,-2,{align:'center',size:12,color:'ink'});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Source sample ${p.index+1}/28: ${p.degrees.toFixed(5)} visual degrees; normalized retinal arc ${p.mm.toFixed(5)} mm. Composite means: cones ${p.cones.toFixed(6)}/mm² (N=${p.coneN}), rods ${p.rods.toFixed(6)}/mm² (N=${p.rodN}).\nUniform-patch count calculation: expected cones ${p.expectedCones.toFixed(6)}, rods ${p.expectedRods.toFixed(6)}; displayed nearest integers ${p.coneCount} and ${p.rodCount}. ${p.rodCount===0&&p.rods>0?'Zero rod icons here reflects rounding of a positive source density. ':''}Symbol positions/sizes and emphasis are authored, with no activation, acuity or visibility prediction.`;});
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num:'4.2',kind:'Phenomenon',name:'Dark adaptation and the rod–cone break',
      statement:String.raw`Dark adaptation depends on the preceding illumination and the test's spectrum, area, location and criterion. After sufficiently strong preadaptation, an early cone-dominated fall can be followed by a later rod-dominated fall, producing a **rod–cone break**. A universal break time or a two-phase curve under every condition is not implied.

Hecht, Haig and Chase's 1937 study used three observers and a peripheral test field after controlled white-light preadaptation. Higher preadaptation delayed the rod-dominated portion. Weak preadaptation and red test light produced different courses; even extreme red light could reveal a small late rod contribution. The displayed lower envelope is an **authored illustration** of a detector using the more sensitive of two branches, not a fitted physiological law.`,
      idea:String.raw`The two receptor systems in 4.1 motivate a branch comparison. Write the illustrative **logarithmic** thresholds, with time $t$ in minutes and authored delay $t_0\in[0.5,4]$, as
$$C(t)=-2.3+3.3e^{-t/1.6},$$
$$R(t)=\begin{cases}5,&t\le t_0,\\-6+11e^{-(t-t_0)/5.5},&t>t_0.\end{cases}$$
All constants and relative threshold units are authored; $t_0$ is not a calibrated bleaching dose. For both branches the chosen log threshold is $\min(C,R)$, since exponentiation preserves order. After $t_0$, the ratio of the positive cone term to the magnitude of the negative rod term in $(R-C)'$ is
$$\frac{3.3/1.6}{11/5.5}\,e^{-t_0/1.6}\,e^{-(t-t_0)(1/1.6-1/5.5)}<1.$$
Thus $R-C$ strictly decreases there. It is positive at $t_0$ and negative at 40 throughout the offered delay range, so the two authored branches cross once. Bisection locates that model crossing; it is not a proof about every human adaptation curve.`,
      caption:String.raw`Move the **authored rod delay** or its purple onset handle; move the time slider or gold probe to inspect the actual selected trace. *Model branch isolation* chooses both, cone-only or rod-only. These are mathematical isolations, not reproductions of foveal or rod-monochromat experiments. Colored curves retain both reference branches, including the full initial rod level 5; the thick trace is the selected model. An orange crossing marker appears only when both branches determine that trace.`,
      deps:['psych-4.1'],refs:['Hecht, Haig and Chase (1937), §§I–VII, methods and Figures 2–5'],tags:['dark adaptation','rods and cones','threshold'],
      credit:'Selig Hecht, Charles Haig and Aurin M. Chase (1937), Journal of General Physiology 20(6):831–850, DOI 10.1085/jgp.20.6.831',
      scope:String.raw`The original used three investigators as observers, a 5° field centered 30° nasally on the retina, 0.2-s flashes, 2-min white preadaptation and a black-cross criterion about three times diffuse visibility threshold. Its historical illumination unit “photon” is not a literal count of light quanta. The illustrative exponential branches, delays and both-branch envelope’s limiting seven-log-unit range (1 to −6) are authored. The isolated rod branch spans eleven log units (5 to −6). These are not source measurements or an adaptation/clinical test. No fixed 7–10-min transition, universal red-light absence of rods or original branch-isolation treatment is claimed.`,
      links:{source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2141534/'},verify: false,
      viz(v){
        const delay=v.slider('authored rod delay $t_0$ (min)',.5,4,2.25,{step:.01,decimals:2}),time=v.slider('probe time (min)',0,40,8,{step:.1}),mode=v.select('model branch isolation',[{value:'both',label:'both model branches'},{value:'cone',label:'model cone only'},{value:'rod',label:'model rod only'}],'both'),A=v.stage({x:[-2.5,42.5],y:[-6.9,6.5],height:370,minWidth:280,axes:'box',gutter:true,xlabel:'time in darkness (min)',ylabel:'log₁₀ relative model threshold',title:'authored recovery branches; no data fit'});
        const hDelay=A.handle(2.25,5.6,{r:8,color:'purple',constrain:x=>[Math.round(v.M.clamp(x,.5,4)*100)/100,5.6],onDrag:h=>delay.set(h.x)}),hTime=A.handle(8,0,{r:8,color:'gold',constrain:x=>[Math.round(v.M.clamp(x,0,40)*10)/10,0],onDrag:h=>time.set(h.x)});let info;
        v.legend([['accent','authored cone branch'],['purple','authored rod branch'],['ink','selected model trace'],['orange','model crossing',{dot:true}],['gold','time probe',{dot:true}]]);
        v.render(()=>{const p=darkAdaptation(delay.value,mode.value,time.value);A.path(p.coneCurve,{color:'accent',width:1.8,alpha:p.mode==='rod'?.4:1});A.path(p.rodCurve,{color:'purple',width:1.8,alpha:p.mode==='cone'?.4:1});A.path(p.selectedCurve,{color:'ink',width:3});hDelay.set(p.t0,5.6);A.line(p.t0,5,p.t0,5.6,{color:'purple',dash:[3,3],width:1});hTime.set(p.time,p.value);if(p.mode==='both')A.dot(p.crossing.t,p.crossing.y,{r:6,color:'orange'});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Authored delay ${p.t0.toFixed(2)} min; probe ${p.time.toFixed(1)} min. Cone log threshold ${p.coneAtTime.toFixed(6)}, rod ${p.rodAtTime.toFixed(6)}; selected ${p.mode} trace ${p.value.toFixed(6)} (relative threshold ${Math.pow(10,p.value).toExponential(6)}).\n${p.mode==='both'?`Unique authored branch crossing at ${p.crossing.t.toFixed(9)} min, log threshold ${p.crossing.y.toFixed(9)}; numerical R−C residual ${p.crossing.residual.toExponential(2)}.`:'This isolated trace has no switch between cone and rod branches.'} The rod reference starts at log threshold 5, and the authored limiting values are C→−2.3 and R→−6. These are model values, not measured observer thresholds.`;});
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num:'4.3',kind:'Phenomenon',name:'The Purkinje shift',
      statement:String.raw`The **Purkinje phenomenon** is a relative reduction in the brightness of long-wavelength lights compared with short-wavelength lights when illumination is reduced from photopic toward mesopic or scotopic conditions, while their relative spectra remain fixed. The spectral luminous-efficiency maximum shifts toward shorter wavelengths.

The CIE photopic function $V(\lambda)$ and scotopic function $V'(\lambda)$ describe standardized whole-observer photometric responses under different conditions. They are not the absorption spectra of individual cone and rod pigments. In the published 1-nm tables, $V$ has its maximum at 555 nm; $V'$ has equal tabulated maxima at 506, 507 and 508 nm.`,
      idea:String.raw`Consider an **authored ideal monochromatic pair**, A and B, with wavelengths in the tables' common 380–780-nm support. Choose radiant powers $P_A=1$ and $P_B=V(\lambda_A)/V(\lambda_B)$. Their photopic weighted products are equal. Under the scotopic weighting, their ratio becomes
$$R=\frac{P_A V'(\lambda_A)}{P_B V'(\lambda_B)}=\frac{V'(\lambda_A)/V(\lambda_A)}{V'(\lambda_B)/V(\lambda_B)}.$$
Common attenuation cancels from each within-condition ratio. Each pair of bars is normalized separately to sum to one. This calculation compares spectral weightings; it does not predict an absolute brightness change between adaptation conditions.`,
      caption:String.raw`The curves retain **all published samples**: photopic 360–830 nm and scotopic 380–780 nm. Lines join adjacent 1-nm samples. Move either wavelength slider or its lower handle; handles snap to integer wavelengths. Filled markers identify A; larger hollow markers identify B, including coincident wavelengths.

The bars show A and B's normalized weighted products in each condition, starting with equal photopic products. Colors identify diagram elements, not the appearance of monochromatic lights on this screen. There is no calibrated mesopic blend, simulated flower, luminance threshold or visibility test.`,
      deps:['psych-4.1'],refs:['CIE S 017:2020 e-ILV 17-22-036 and 17-21-035','CIE (2019), photopic and scotopic spectral luminous-efficiency datasets'],tags:['spectral sensitivity','rods and cones','photometry'],
      credit:'CIE (2019) tabulated luminous-efficiency functions, DOI 10.25039/CIE.DS.dktna2s3 and 10.25039/CIE.DS.gr6w4b5g; data CC BY-SA 4.0',
      scope:String.raw`The weighting functions depend on the stated photometric conditions, including adaptation and field size/position; they are not universal brightness functions for every stimulus or observer. Rods principally mediate scotopic vision, cones photopic vision. The authored pair uses radiant-power weighting, not equal photon counts. Separately normalized shares discard absolute luminous-efficacy constants and adaptation gains. The actual scotopic CSV spans 380–780 nm despite an inconsistent range in its metadata abstract; no missing tail is filled in. No original Purkyně publication or historical priority is claimed.`,
      links:{source:'https://cie.co.at/eilvterm/17-22-036',photopic:'https://www.cie.co.at/datatable/cie-spectral-luminous-efficiency-photopic-vision',scotopic:'https://www.cie.co.at/datatable/cie-spectral-luminous-efficiency-scotopic-vision',license:'https://creativecommons.org/licenses/by-sa/4.0/'},verify: false,
      viz(v){
        const a=v.slider('wavelength A (nm)',380,780,450,{int:true}),b=v.slider('wavelength B (nm)',380,780,650,{int:true});
        const A=v.stage({x:[350,840],y:[-.5,1.15],height:340,minWidth:260,axes:'box',gutter:true,xlabel:'wavelength (nm)',ylabel:'relative luminous efficiency',xticks:[400,500,600,700,800],yticks:[0,.5,1],title:'published CIE observer functions'}),B=v.stage({x:[-.65,3.65],y:[-.16,1.16],height:340,minWidth:260,axes:'box',gutter:true,xlabel:'separate within-condition normalization',ylabel:'share of weighted pair',xticks:[[0,'A'],[1,'B'],[2,'A'],[3,'B']],yticks:[0,.5,1],title:'authored photopically balanced pair'});
        const ha=A.handle(450,-.12,{r:7,color:'gold',constrain:x=>[Math.round(v.M.clamp(x,380,780)),-.12],onDrag:h=>a.set(h.x)}),hb=A.handle(650,-.32,{r:7,color:'orange',constrain:x=>[Math.round(v.M.clamp(x,380,780)),-.32],onDrag:h=>b.set(h.x)});let info;
        v.legend([['accent','photopic V'],['purple','scotopic V′'],['gold','pair A',{dot:true}],['orange','pair B',{dot:true}]]);
        v.render(()=>{const p=spectralPair(a.value,b.value);A.path(CIE_PHOTOPIC,{color:'accent',width:2});A.path(CIE_SCOTOPIC,{color:'purple',width:2});for(const[x,y,color]of[[p.b,p.vb,'accent'],[p.b,p.sb,'purple']])A.dot(x,y,{r:7,color,hollow:true});for(const[x,y,color]of[[p.a,p.va,'accent'],[p.a,p.sa,'purple']])A.dot(x,y,{r:4,color});ha.set(p.a,-.12);hb.set(p.b,-.32);for(const[i,h]of[...p.photopic,...p.scotopic].entries())B.rect(i-.28,0,i+.28,h,{fill:i%2?'orange':'gold',fillAlpha:.65,stroke:false});B.text('photopic',.5,-.09,{align:'center',size:11,color:'ink'});B.text('scotopic',2.5,-.09,{align:'center',size:11,color:'ink'});info=p;});
        v.readout(()=>{if(!info)return'';const p=info,f=x=>x.toExponential(6);return `A ${p.a} nm: V=${f(p.va)}, V′=${f(p.sa)}. B ${p.b} nm: V=${f(p.vb)}, V′=${f(p.sb)}.\nAuthored radiant powers A=1, B=${f(p.powerB)}. Photopic shares A=0.5, B=0.5. Scotopic shares A=${f(p.scotopic[0])}, B=${f(p.scotopic[1])}; scotopic A/B=${f(p.ratio)}. Separately normalized products, not screen appearance or absolute cross-condition brightness.`;});
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Concept',
      name: 'Convergence trades acuity for sensitivity',
      statement: String.raw`Many receptors feed one ganglion cell, and the ratio differs across the retina: in the central fovea one cone drives (through bipolar cells) about one ganglion cell, while in the periphery hundreds of rods converge on one. Pooling $g$ receptors that have independent noise raises the signal-to-noise ratio of a faint, extended stimulus by $\sqrt g$, so convergence raises **sensitivity**; but the pooled cell cannot tell which receptor was hit, so the finest grating it can resolve has period about $2g$ receptor spacings. Sensitivity thus rises and acuity falls as $g$ grows, and the best pool for detecting a spot is one about as large as the spot.`,
      idea: String.raw`The sum of $g$ receptor signals each carrying signal $s$ and independent noise of standard deviation $\sigma$ has signal $gs$ and noise $\sigma\sqrt g$, so the ratio is $\sqrt g\,s/\sigma$, for as long as the whole pool lies inside the stimulus; if the spot covers only $k<g$ of the receptors, the signal is $ks$ while the noise still grows as $\sqrt g$, which is why detection peaks at $g\approx k$. Averaging over the pool is a box-shaped blur, whose frequency response $|\operatorname{sinc}(\pi f g)|$ cuts the contrast of fine gratings, and sampling at one value per pool aliases anything finer than $1/(2g)$ cycles per receptor.`,
      caption: String.raw`A row of 48 receptors (top, **blue**) is wired into groups of $g$ (the **orange** brackets), each giving one output (bottom). Choose *grating* or *dim spot*. Raise the **pool size** $g$: the grating's modulation at the ganglion level collapses once its frequency passes the sampling limit (the **green** line in the middle panel), while the dim spot's detectability $d'$ (right panel) climbs as $\sqrt g$ up to the spot's size and then falls. A model with independent, Gaussian receptor noise and a flat pool; real pooling is weighted and noise is partly shared.`,
      deps: ['psych-4.1'],
      refs: ['Goldstein ch. 3'],
      tags: ['convergence', 'acuity', 'sensitivity'],
      scope: String.raw`Holds for independent noise and uniform pooling over the stimulus; shared noise (for example from the photon statistics of the stimulus itself) is not reduced by pooling in the same way.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Retinal_ganglion_cell' },
      viz(v) {
        const mode = v.select('Stimulus', [{ value: 'grat', label: 'grating' }, { value: 'spot', label: 'dim spot' }], 'grat');
        const gs = v.select('Pool size $g$', ['1', '2', '3', '4', '6', '8', '12'], '4');
        const fq = v.slider('grating frequency (cycles/receptor)', 0.02, 0.5, 0.11, { step: 0.005 });
        const sg = v.slider('spot signal per receptor ($s/\\sigma$)', 0.1, 1.5, 0.45, { step: 0.01 });
        const N = 48, KS = 6;
        const rw = v.stage({ x: [0, N], y: [-3.4, 3.2], axes: false, height: 290, weight: 1.5, minWidth: 340, title: 'receptors (top) and ganglion cells (bottom)' });
        const tf = v.stage({ x: [0, 0.5], y: [0, 1.15], axes: 'box', gutter: true, height: 290, weight: 0.9, minWidth: 250, xlabel: 'grating frequency (cycles per receptor)', ylabel: 'modulation at the ganglion', title: 'what pooling does to a grating' });
        const dp = v.stage({ x: [0, 7], y: [0, 4], axes: 'box', gutter: true, height: 290, weight: 0.9, minWidth: 250, xlabel: 'pool size g', ylabel: 'detectability d′', title: 'detecting a 6-receptor spot', xticks: [[0.5, '1'], [1.5, '2'], [2.5, '3'], [3.5, '4'], [4.5, '6'], [5.5, '8'], [6.5, '12']] });
        const G = [1, 2, 3, 4, 6, 8, 12];
        const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
        const gOf = () => +gs.value;
        v.legend([['accent', 'receptors', { area: true }], ['orange', 'ganglion outputs', { area: true }], ['green', 'sampling limit 1/(2g)', { dash: true }]]);
        let info = null;
        v.render(() => {
          const g = gOf(), f = fq.value, R = v.rng(3);
          const noise = Array.from({ length: N }, () => R.normal() * 0.12);
          const x0 = 20, inSpot = (i) => i >= x0 && i < x0 + KS;
          const stim = (i) => (mode.value === 'grat' ? 0.5 + 0.5 * Math.cos(2 * Math.PI * f * (i + 0.5)) : inSpot(i) ? Math.min(1, sg.value * 0.7) : 0);
          const vals = Array.from({ length: N }, (_, i) => stim(i) + (mode.value === 'spot' ? noise[i] * 1.2 : 0));
          for (let i = 0; i < N; i++) rw.rect(i + 0.06, 0.5, i + 0.94, 0.5 + 2.4 * Math.max(0, vals[i]), { fill: 'accent', fillAlpha: 0.7, stroke: false });
          rw.line(0, 0.5, N, 0.5, { color: 'muted', width: 1 });
          const out = [];
          for (let a = 0; a < N; a += g) {
            const b = Math.min(N, a + g); let m = 0; for (let i = a; i < b; i++) m += vals[i]; m /= b - a; out.push([a, b, m]);
            rw.line(a + 0.15, 3.05, b - 0.15, 3.05, { color: 'orange', width: 3 });
            rw.rect(a + 0.06, -0.5, b - 0.06, -0.5 - 2.4 * Math.max(0, m), { fill: 'orange', fillAlpha: 0.75, stroke: false });
          }
          rw.line(0, -0.5, N, -0.5, { color: 'muted', width: 1 });
          if (mode.value === 'spot') rw.text('spot', x0 + KS / 2, 0.85 + 2.4 * 0.0, { align: 'center', color: 'muted', size: 11.5, dy: 0, dx: 0 });
          // transfer
          tf.fn((x) => Math.abs(sinc(Math.PI * x * g)), { domain: [0.001, 0.5], color: 'ink', width: 2.4 });
          tf.vline(0.5 / g, { color: 'green', dash: [5, 4], width: 1.6 });
          tf.dot(f, Math.abs(sinc(Math.PI * f * g)), { r: 6, color: 'gold' });
          tf.vline(f, { color: 'gold', alpha: 0.5, width: 1 });
          tf.text('1/(2g)', 0.5 / g, 1.08, { dx: 4, align: 'left', color: 'green', size: 11.5, weight: 600 });
          // d'
          G.forEach((gg, i) => {
            const dd = gg <= KS ? Math.sqrt(gg) * sg.value : (KS * sg.value) / Math.sqrt(gg);
            dp.rect(i + 0.12, 0, i + 0.88, dd, { fill: gg === g ? 'orange' : 'muted', fillAlpha: gg === g ? 0.8 : 0.35, stroke: false });
          });
          dp.hline(1, { color: 'faint', dash: [4, 3] });
          const dd = g <= KS ? Math.sqrt(g) * sg.value : (KS * sg.value) / Math.sqrt(g);
          info = { g, f, mod: Math.abs(sinc(Math.PI * f * g)), dd, lim: 0.5 / g };
        });
        v.readout(() => info ? `$g=${info.g}$: sampling limit ${v.fix(info.lim, 3)} cycles/receptor${info.f > info.lim ? ' (**the grating is above it: aliased or lost**)' : ''} · modulation kept at $f=${v.fix(info.f, 3)}$: ${v.fix(100 * info.mod, 0)}% · detectability of a 6-receptor spot $d'=\\sqrt g\\,s/\\sigma$ = ${v.fix(info.dd, 2)} (best at $g\\approx6$, $d'=${v.fix(Math.sqrt(6) * sg.value, 2)}$)` : '');
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num:'4.5',kind:'Law',name:'Ricco’s and Bloch’s laws of summation',
      statement:String.raw`At a **specified detection criterion and fixed other conditions**, complete spatial summation means threshold intensity varies approximately as $I_{\rm th}A=C_A$ over a limited area range (Ricco's law). Complete temporal summation means $I_{\rm th}t=C_t$ over a limited duration range (commonly called Bloch's law). The corresponding log–log slopes are −1.

Critical areas and durations depend on the experiment, including background, retinal location, spectrum and the other stimulus dimension. Barlow's 1958 measurements show that the spatial and temporal limits also depend on one another. These laws do not assert that every flash is completely summed, or that all spatial and temporal effects factor into one universal formula.`,
      idea:String.raw`These **two separate authored cuts** use $x=A$ or $x=t$, each with its own critical value $x_c$. They illustrate the reciprocity algebra, not a fit to Barlow's measurements:
Write $r=x/x_c$ and $H=I_{\rm th}(x)/I_{\rm th}(x_c)$. The chosen rule is
$$H=\begin{cases}r^{-1},&r\le1,\\r^{-\beta},&r>1.\end{cases}$$
The offered exponent is $0\le\beta\le0.9$.
Thus the dimensionless product $H(x)(x/x_c)$ is 1 below the cut and $(x/x_c)^{1-\beta}$ above it. The threshold's slopes are −1 and $-\beta$; the product's slopes are 0 and $1-\beta$. For $\beta=0$ the post-critical threshold is flat; for $0<\beta<1$ summation there is partial. The corner is an authored idealization.

A fixed-total-signal pooling model can motivate reciprocity under additional assumptions. Psychophysical critical limits alone do not identify one anatomical pool or a receptor integration time; Barlow explicitly warns against that inference.`,
      caption:String.raw`Both axes display logarithmic coordinates. The solid curves show $\log_{10}H$ and the dashed curves $\log_{10}[H(x)(x/x_c)]$. Tick labels on the horizontal axes give ordinary area or duration. Gold handles move the authored critical values, where both curves equal zero. The controls set logarithmic critical coordinates; the readout gives physical units. No foveal/rod presets or measured observer curves are supplied.

Area is angular area in arcmin² and duration is in ms. Intensity times angular area is not labeled energy. The displayed products are dimensionless; a physical flux or energy conversion would require a specified radiometric quantity, solid angle, aperture and/or duration.`,
      deps:['psych-1.1'],see:['psych-4.4'],refs:['Barlow (1958), methods, Figures 1–3 and discussion/summary, pp. 337–350','Kalloniatis and Luu (2007), Webvision: Temporal Resolution, §1'],tags:['spatial summation','temporal summation','threshold'],
      credit:'Horace B. Barlow (1958), Journal of Physiology 141:337–350, DOI 10.1113/jphysiol.1958.sp005978; Kalloniatis and Luu (2007), technical exposition of the Bloch name',
      scope:String.raw`Barlow studied two observers with a blue-green filtered stimulus (energy peak 497 nm), a peripheral field centered 6°30′ from the fovea, a 2-mm artificial pupil and an approximately 80%-seen adjustment criterion. Reported intensities were expressed as 507-nm-equivalent quanta per second per square degree. Figures 2–3 use one observer's curves. These conditions differ from the generic 50% operational example in 1.1. Barlow calls temporal reciprocity the Bunsen–Roscoe law; the Bloch name here follows the identified Webvision exposition. No original Ricco/Bloch publication or priority claim is made. Authored areas, durations, exponents and sharp cuts are not experimental estimates, a clinical test or a joint prediction of both cuts.`,
      links:{source:'https://pmc.ncbi.nlm.nih.gov/articles/PMC1358805/',exposition:'https://www.webvision.pitt.edu/book/part-viii-psychophysics-of-vision/temporal-resolution/'},verify: false,
      viz(v){
        const ca=v.slider('area cut (log₁₀)',.3,3.9,1.5,{step:'any',decimals:6,fmt:x=>x.toFixed(9)}),ct=v.slider('duration cut (log₁₀)',.3,3,1.7,{step:'any',decimals:6,fmt:x=>x.toFixed(9)}),beta=v.slider('post-critical β',0,.9,.3,{step:'any',decimals:6,fmt:x=>x.toFixed(9)});
        const opts={y:[-4.4,4.5],height:340,minWidth:260,axes:'box',gutter:true,ylabel:'log₁₀ normalized threshold / product',yticks:[-4,-2,0,2,4]};
        const A=v.stage({...opts,x:[-.3,4.5],xlabel:'angular area (arcmin²; log spacing)',xticks:[[0,'1'],[1,'10'],[2,'100'],[3,'1k'],[4,'10k']],title:'authored spatial cut'}),B=v.stage({...opts,x:[-.3,3.5],xlabel:'duration (ms; log spacing)',xticks:[[0,'1'],[1,'10'],[2,'100'],[3,'1k']],title:'authored temporal cut'});
        const ha=A.handle(1.5,0,{r:8,color:'gold',constrain:x=>[v.M.clamp(x,.3,3.9),0],onDrag:h=>ca.set(h.x)}),ht=B.handle(1.7,0,{r:8,color:'gold',constrain:x=>[v.M.clamp(x,.3,3),0],onDrag:h=>ct.set(h.x)});let info;
        v.legend([['ink','normalized threshold H'],['accent','dimensionless product H·(x/x_c)',{dash:true}]]);
        v.render(()=>{const p=summationCuts(ca.value,ct.value,beta.value);for(const[s,q]of[[A,p.area],[B,p.time]]){s.path(q.threshold,{color:'ink',width:3});s.path(q.product,{color:'accent',width:2,dash:[5,4]});}ha.set(p.area.c,0);ht.set(p.time.c,0);info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Authored critical area ${p.area.critical.toPrecision(9)} arcmin²; critical duration ${p.time.critical.toPrecision(9)} ms. β=${p.beta.toFixed(9)}. Threshold log slopes −1 then −β; dimensionless-product slopes 0 then 1−β=${(1-p.beta).toFixed(9)}.\nSpatial H at 1 and 10^4.2 arcmin²: ${p.area.first.toExponential(6)}, ${p.area.last.toExponential(6)}; final normalized product ${p.area.lastProduct.toExponential(6)}. Temporal H at 1 and 10^3.2 ms: ${p.time.first.toExponential(6)}, ${p.time.last.toExponential(6)}; final normalized product ${p.time.lastProduct.toExponential(6)}. Separate authored cuts, not measured thresholds or a universal joint summation law.`;});
      },
    },
  ],
};
