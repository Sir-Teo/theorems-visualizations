// Psychology & Perception — Chapter 4: Early vision (items 4.1–4.5; 4.6–4.10 are in ch04-b.js, 4.11–4.14 in ch04-c.js)
import { logTicks, grey, clamp01, smooth01, coneDensity, rodDensity, BLIND } from './ch04.shared.js';
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
      num: '4.3',
      kind: 'Phenomenon',
      name: 'The Purkinje shift',
      statement: String.raw`Two coloured surfaces that look equally bright in daylight do not stay equally bright as the light fades. Because the rods' spectral sensitivity peaks at a shorter wavelength (about 507 nm) than the cones' (about 555 nm), red and orange surfaces lose brightness faster than blue and green ones: in dim light the red looks nearly black while the blue still looks light. The change from photopic to scotopic vision thus shifts the peak of the brightness-versus-wavelength curve toward the blue end of the spectrum.`,
      idea: String.raw`The brightness of a surface is roughly the integral of its reflected spectrum against the sensitivity curve of the receptors in use: $B=\int R(\lambda)\,E\,S(\lambda)\,d\lambda$. Replace the cone curve $V(\lambda)$ by the rod curve $V'(\lambda)$ (which is nearly zero beyond 640 nm) and a long-wavelength surface contributes almost nothing. In the mesopic range the effective curve is a blend whose weights slide from cones to rods as the light dims, so the shift is gradual.`,
      caption: String.raw`**Left:** relative spectral sensitivity of the cones ($V$, blue) and of the rods ($V'$, purple), with the blend you are seeing with (black). The faint red and blue areas are the reflectance spectra of the two flowers. **Right:** the two flowers as they look at the chosen light level; they were scaled to be equally bright in daylight. Drag the **light level** down through the mesopic range and watch the peak slide from 555 toward 507 nm while the red flower goes dark first. The curves are smooth analytic stand-ins that reproduce the two peak wavelengths and the long-wavelength tails (they are not the tabulated CIE functions), and the red and blue reflectances are invented.`,
      deps: ['psych-4.1'],
      refs: ['Goldstein ch. 2'],
      tags: ['spectral sensitivity', 'rods and cones', 'brightness'],
      credit: 'Jan Evangelista Purkyně, 1825 (unconfirmed)',
      scope: String.raw`Photopic and scotopic standard observers (CIE) are averages; the transition levels used here (rods dominating below about 0.01 cd/m², cones above about 3 cd/m²) are conventional round numbers. Rods are absent from the fovea, so the shift is a peripheral effect for small, centrally fixated objects.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Purkinje_effect' },
      verify: true,
      viz(v) {
        const lv = v.slider('light level, $\\log_{10}$ luminance (cd/m²)', -4.5, 2, -1, { step: 0.05 });
        const sp = v.stage({ x: [400, 700], y: [0, 1.12], axes: 'box', gutter: true, height: 300, weight: 1.2, minWidth: 320, xlabel: 'wavelength (nm)', ylabel: 'relative sensitivity', title: 'spectral sensitivity', xticks: [400, 450, 500, 550, 600, 650, 700] });
        const fl = v.stage({ x: [0, 10], y: [0, 6], equal: true, axes: false, height: 300, weight: 0.8, minWidth: 240, title: 'two flowers' });
        const ag = (l, p, a, b) => Math.exp(-0.5 * ((l - p) / (l < p ? a : b)) ** 2);
        const Vp = (l) => 0.821 * ag(l, 568.8, 46.9, 40.5) + 0.286 * ag(l, 530.9, 16.3, 31.1); // multi-lobe fit to the CIE 1931 y-bar (Wyman, Sloan & Shirley 2013, from memory)
        const VpMax = 1.0 * Math.max(...Array.from({ length: 301 }, (_, i) => Vp(400 + i)));
        const V = (l) => Vp(l) / VpMax;
        const Vs = (l) => ag(l, 507, 40, 37);
        const red = (l) => 0.9 / (1 + Math.exp(-(l - 600) / 12)), blue = (l) => 0.8 * Math.exp(-0.5 * ((l - 450) / 28) ** 2) + 0.08;
        const wr = (L) => 1 - smooth01((L + 2) / 2.5);
        const integ = (R, S) => { let a = 0; for (let l = 400; l <= 700; l += 5) a += R(l) * S(l); return a; };
        const kBlue = integ(red, V) / integ(blue, V); // equal in daylight
        const mix = (l, w) => (1 - w) * V(l) + w * Vs(l);
        let st = null;
        v.legend([['accent', 'cones  V(λ)'], ['purple', 'rods  V′(λ)'], ['ink', 'what you see with'], ['red', 'red flower', { area: true }], ['blue', 'blue flower', { area: true }]]);
        v.render(() => {
          const L = lv.value, w = wr(L);
          sp.fn((l) => red(l) * 0.55, { domain: [400, 700], color: 'red', fill: true, fillAlpha: 0.1, width: 1, alpha: 0.5 });
          sp.fn((l) => blue(l) * 0.55 * kBlue, { domain: [400, 700], color: 'blue', fill: true, fillAlpha: 0.1, width: 1, alpha: 0.5 });
          sp.fn(V, { domain: [400, 700], color: 'accent', width: 1.8, alpha: 0.6 });
          sp.fn(Vs, { domain: [400, 700], color: 'purple', width: 1.8, alpha: 0.6 });
          const eff = (l) => mix(l, w);
          let pk = 400, pm = 0, mx = 0;
          for (let l = 400; l <= 700; l += 1) { const e = eff(l); if (e > pm) { pm = e; pk = l; } }
          sp.fn((l) => eff(l) / pm, { domain: [400, 700], color: 'ink', width: 3 });
          sp.vline(pk, { color: 'gold', dash: [4, 3], width: 1.5 });
          sp.text(`peak ${pk} nm`, pk, 1.06, { dx: pk > 560 ? -6 : 6, align: pk > 560 ? 'right' : 'left', color: 'gold', weight: 700, size: 12.5 });
          const Br = integ(red, (l) => mix(l, w)), Bb = kBlue * integ(blue, (l) => mix(l, w));
          const k = Math.max(Br, Bb), br = Br / k, bb = Bb / k;
          const shade = (rgb, b) => rgb.map((c) => Math.round(c * Math.pow(b, 0.6)));
          const flower = (cx, rgb, b, name) => {
            for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; fl.circle(cx + 1.15 * Math.cos(a), 3.1 + 1.15 * Math.sin(a), 0.95, { fill: shade(rgb, b), fillAlpha: 1, stroke: false }); }
            fl.circle(cx, 3.1, 0.7, { fill: shade([230, 200, 70], Math.max(b, 0.3)), fillAlpha: 1, stroke: false });
            fl.text(name + ' ' + v.fix(b, 2), cx, 0.9, { align: 'center', size: 12.5, color: 'ink', weight: 600 });
          };
          fl.rect(0, 0, 10, 6, { fill: [20, 24, 20], fillAlpha: 1, stroke: false });
          flower(2.7, [215, 40, 40], br, 'red'); flower(7.3, [50, 80, 220], bb, 'blue');
          st = { pk, w, br, bb, ratio: Br / Bb };
        });
        v.readout(() => st ? `Rod weight ${v.fix(st.w, 2)} · effective peak **${st.pk} nm** (≈555 nm in daylight, 507 nm in the dark) · brightness red : blue = ${v.fix(st.ratio, 3)} (1 by construction in daylight)` : '');
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
      num: '4.5',
      kind: 'Law',
      name: 'Ricco’s and Bloch’s laws of summation',
      statement: String.raw`For a brief flash seen at threshold, the visual system adds light over space and time completely, up to a limit. **Ricco's law:** for a test spot smaller than a critical area $A_c$, the threshold intensity $I$ is inversely proportional to the area, $I\cdot A=\text{const}$, so only the total flux matters. **Bloch's law:** for a flash shorter than a critical duration $t_c$, $I\cdot t=\text{const}$, so only the total energy matters. Beyond $A_c$ or $t_c$ the summation is only partial: the threshold falls more slowly than $1/A$ or $1/t$, and on log–log axes the line of slope $-1$ bends toward a shallower slope.`,
      idea: String.raw`If a pool of receptors (4.4) sums linearly and the detection rule is a fixed total signal, then the spot threshold is set by the flux falling on the pool. Once the spot is bigger than the pool, extra light lands outside it and cannot help, so the threshold flux grows with area. The same argument holds in time for the integration time of the photoreceptors. The critical area is therefore a footprint of the pooling (small in the fovea, large in the dark-adapted periphery) and the critical duration is the receptors' integration time.`,
      caption: String.raw`Log–log plots of threshold intensity against stimulus area (left) and duration (right). The **solid** curve is the threshold intensity, the **dashed** curve the threshold energy $I\cdot A$ (or $I\cdot t$), which is flat exactly where the law holds. Drag the **gold** handles to move the critical size, or choose a preset: the foveal cones sum over a small area and briefly, the dark-adapted periphery over a large area and for longer. The slider sets the slope beyond the critical value (partial summation). Presets are **typical orders of magnitude** for illustration (about 6 arcmin and 50 ms for the cones, about 1° and 100 ms for the rods), not measurements.`,
      deps: ['psych-4.4'],
      refs: ['Goldstein ch. 3'],
      tags: ['spatial summation', 'temporal summation', 'threshold'],
      credit: 'Ricco, 1877 (spatial); A.-M. Bloch, 1885 (temporal) — dates unconfirmed',
      scope: String.raw`Complete summation holds for near-threshold flashes on a dark background; the critical area and duration both depend on the retinal location, the background level and the state of adaptation (they get larger in the dark), and the transition between the two regimes is gradual, not the sharp corner drawn here.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ricco%27s_law' },
      verify: true,
      viz(v) {
        const pre = v.select('Preset', [{ value: 'fov', label: 'fovea (cones)' }, { value: 'per', label: 'periphery, dark-adapted (rods)' }], 'fov');
        const beta = v.slider('slope beyond the critical size', 0, 0.9, 0.3, { step: 0.01 });
        const PR = { fov: [Math.log10(28), Math.log10(50)], per: [Math.log10(2800), Math.log10(100)] };
        const sa = v.stage({ x: [0, 4.2], y: [-5, 2], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 290, xlabel: 'area of the spot (arcmin²)', ylabel: 'log threshold', title: 'Ricco: area', xticks: logTicks(0, 4.2, { mult: [1] }), yticks: [-4, -3, -2, -1, 0, 1] });
        const st = v.stage({ x: [0.8, 3.2], y: [-5, 2], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 290, xlabel: 'flash duration (ms)', ylabel: 'log threshold', title: 'Bloch: duration', xticks: logTicks(0.8, 3.2, { mult: [1, 3] }), yticks: [-4, -3, -2, -1, 0, 1] });
        const th = (a, ac, b) => 0.5 - Math.min(a, ac) - b * Math.max(0, a - ac);
        function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
        const ha = sa.handle(PR.fov[0], 0, { color: 'gold', r: 8, label: 'A_c', labelPos: 'n', constrain: (x) => { const c = clamp(x, 0.3, 3.9); return [c, th(c, c, 0)]; } });
        const ht = st.handle(PR.fov[1], 0, { color: 'gold', r: 8, label: 't_c', labelPos: 'n', constrain: (x) => { const c = clamp(x, 1.1, 3.0); return [c, th(c, c, 0)]; } });
        let last = pre.value;
        v.legend([['ink', 'threshold intensity'], ['accent', 'threshold energy (I·A or I·t)', { dash: true }]]);
        let info = null;
        v.render(() => {
          if (pre.value !== last) { last = pre.value; ha.set(PR[last][0], 0); ht.set(PR[last][1], 0); }
          const ac = ha.x, tc = ht.x, b = beta.value;
          sa.fn((a) => th(a, ac, b), { domain: [0, 4.2], color: 'ink', width: 3 });
          sa.fn((a) => th(a, ac, b) + a, { domain: [0, 4.2], color: 'accent', width: 2, dash: [5, 4] });
          st.fn((t) => th(t, tc, b), { domain: [0.8, 3.2], color: 'ink', width: 3 });
          st.fn((t) => th(t, tc, b) + t - 3, { domain: [0.8, 3.2], color: 'accent', width: 2, dash: [5, 4] });
          ha.set(ac, th(ac, ac, b)); ht.set(tc, th(tc, tc, b));
          sa.text('slope −1', ac / 2, th(ac / 2, ac, b), { dx: 8, dy: -14, align: 'left', color: 'muted', size: 12 });
          st.text('slope −1', 0.8 + (tc - 0.8) / 2, th(0.8 + (tc - 0.8) / 2, tc, b), { dx: 8, dy: -14, align: 'left', color: 'muted', size: 12 });
          info = { Ac: Math.pow(10, ac), tc: Math.pow(10, tc) };
        });
        v.readout(() => info ? `Critical area ≈ ${v.fmt(info.Ac, 3)} arcmin² (a disc of diameter ${v.fix(2 * Math.sqrt(info.Ac / Math.PI) / 60, 2)}°) · critical duration ≈ ${v.fmt(info.tc, 3)} ms · below them the threshold energy is **constant** (the dashed lines are flat); beyond them it rises on the log–log plot with slope ${v.fix(1 - beta.value, 2)}` : '');
      },
    },
  ],
};
