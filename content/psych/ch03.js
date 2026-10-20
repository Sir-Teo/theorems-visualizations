import { shiftedPower, matching } from './source-audit-scaling.js';
// Psychology & Perception — Chapter 3: Scaling sensation (items 3.1–3.5; 3.6–3.10 are in ch03-b.js)
import { EXPS, EXP, logTicks, sig, pc } from './ch03.shared.js';

export default {
  collection: 'psych',
  chapter: 3,
  title: 'Scaling sensation',
  summary: String.raw`Chapter 1 asked how much stimulus is needed to notice a change; this chapter asks how big a sensation feels. Direct methods let people assign numbers to sensations (magnitude estimation) or match one kind of sensation with another, and the results fall on straight lines in log–log coordinates: Stevens' power law, with an exponent that is compressive for brightness, nearly linear for length and strongly expansive for electric shock. That challenges Fechner's logarithm, and the question of which law is right turns out to depend on what a just-noticeable difference measures. The second half turns to indirect scales built from choices and judgments instead of numbers: category ratings that depend on the context (Parducci), Thurstone's law of comparative judgment and Luce's choice axiom, the sone scale for loudness, and multidimensional scaling, which recovers a map of stimuli from their judged similarities.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Method',
      name: 'Magnitude estimation',
      statement: String.raw`In **magnitude estimation** the experimenter presents stimuli of various intensities $I$ in irregular order and the observer assigns each a number proportional to how strong it seems. Usually one stimulus is shown first as a **standard** or *modulus* with a number fixed by the experimenter (here, 10), and every other stimulus is judged relative to it: “twice as strong” means 20, “a tenth as strong” means 1. The numbers from many observers are combined by their geometric mean (the number of one observer is arbitrary up to a unit, so averages are taken in logs), and the result is plotted against $I$ on log–log axes. If the points fall near a straight line $\log\psi=n\log I+\log k$, the sensation $\psi$ is a power function of the stimulus with exponent $n$ (3.2); the fitted slope is the observer's estimate of $n$.`,
      idea: String.raw`The method takes at face value that people can report ratios of sensations. The assumption that numbers can be assigned to sensations in this way is exactly what Fechner's school doubted, and later critics have continued to doubt it; its evidence is internal consistency (straight log–log lines, the agreement of different modulus choices) and the cross-modality matches of 3.4. A just-noticeable difference (psych-1.2) was Fechner's unit of sensation; magnitude estimation replaces the unit by a ratio judgment, so the scale it yields is a ratio scale (zero means no sensation) rather than a count of discriminable steps.`,
      caption: String.raw`**Left:** seven squares of different area; the **standard** (outlined, area 1) is worth 10. **Right:** the log–log plot of your estimates against area. Drag each **blue** handle up or down to the number you would call out for that square; the **green** line is the least-squares fit and the dashed line is what judging number $\propto$ area would give (slope 1). *New simulated judge* (or the sliders) gives a judge with the chosen exponent and noise; try to match the judge's slope with your own handles, and see how a few noisy points move the fitted slope and its standard error. The data are simulated, not from a real experiment.`,
      deps: ['psych-1.2'],
      refs: ['Gescheider ch. 11'],
      tags: ['magnitude estimation', 'scaling', 'ratio scale'],
      credit: 'S. S. Stevens, 1950s (Stevens 1956, Am. J. Psychol. 69: 1–25, for loudness; Stevens 1957, Psychol. Rev. 64: 153–181)',
      scope: String.raw`The slope depends somewhat on the procedure (instructions, whether a modulus is given and what number it carries, the range of the stimuli) and individual observers differ widely; people also tend to prefer round numbers, and estimates are biased toward the middle of the range used (a regression effect). Whether the numbers measure sensation, or only reflect how people use numbers, is disputed.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Magnitude_estimation' },
      viz(v) {
        const M = v.M, AREAS = [0.15, 0.3, 0.55, 1, 1.8, 3.3, 6], STD = 3, LX = AREAS.map((a) => Math.log10(a));
        let seed = 4, last = 0.7;
        const nSl = v.slider('simulated judge’s exponent', 0.2, 1.6, 0.7, { step: 0.01, onChange: () => gen() });
        const sdSl = v.slider('noise (log₁₀ units)', 0, 0.3, 0.07, { step: 0.01, onChange: () => gen() });
        v.button('New simulated judge', () => { seed = 1 + ((Math.random() * 1e9) | 0); gen(); });
        const sq = v.stage({ x: [0, 17], y: [-1.7, 3.4], equal: true, axes: false, height: 230, weight: 1.05, minWidth: 300, title: 'the stimuli: squares of different area' });
        const ll = v.stage({ x: [-0.95, 0.95], y: [-0.2, 2.6], axes: 'box', gutter: true, height: 300, weight: 0.95, xlabel: 'area (standard = 1)', ylabel: 'your number', xticks: logTicks(-0.95, 0.95), yticks: logTicks(-0.2, 2.6), title: 'log–log plot of the estimates' });
        const H = AREAS.map((a, i) => ll.handle(LX[i], 1 + 0.7 * LX[i], { color: i === STD ? 'muted' : 'accent', r: 7, constrain: (x, y) => [LX[i], i === STD ? 1 : M.clamp(y, -0.15, 2.55)] }));
        function gen() {
          const R = v.rng(seed); const n = nSl.value; last = n;
          AREAS.forEach((a, i) => { const e = R.normal() * sdSl.value; H[i].set(LX[i], i === STD ? 1 : 1 + n * LX[i] + e); });
        }
        gen();
        v.legend([['accent', 'your estimate'], ['green', 'least-squares line'], ['muted', 'number ∝ area', { dash: true }]]);
        let fit = null;
        v.render(() => {
          const ys = H.map((h) => h.y); fit = M.linreg(LX, ys);
          // squares
          let x = 0.4; const side = (a) => 1.55 * Math.sqrt(a);
          AREAS.forEach((a, i) => {
            const w = side(a);
            sq.rect(x, 0, x + w, w, { fill: i === STD ? 'accent' : 'muted', fillAlpha: i === STD ? 0.32 : 0.2, color: i === STD ? 'accent' : 'muted', width: i === STD ? 2.4 : 1.2 });
            sq.text(String(Math.round(Math.pow(10, ys[i]) * (Math.abs(ys[i]) < 1.5 ? 10 : 1)) / (Math.abs(ys[i]) < 1.5 ? 10 : 1)), x + w / 2, -0.6, { align: 'center', size: 13, weight: 700, color: i === STD ? 'ink' : 'accent' });
            if (i === STD) sq.text('standard', x + w / 2, w + 0.35, { align: 'center', size: 11.5, color: 'muted', weight: 600 });
            x += w + 0.45;
          });
          sq.text('number you assign', 8.5, -1.35, { align: 'center', size: 11.5, color: 'muted' });
          // log-log
          ll.line(-0.95, 1 - 0.95, 0.95, 1 + 0.95, { color: 'muted', dash: [5, 4], width: 1.4 });
          ll.line(-0.95, fit.predict(-0.95), 0.95, fit.predict(0.95), { color: 'green', width: 2.4 });
          ll.text('slope ' + v.fix(fit.slope, 2), 0.93, fit.predict(0.93), { align: 'right', dy: 16, color: 'green', weight: 700, size: 12.5 });
          ll.dot(0, 1, { r: 3, color: 'muted' });
        });
        v.readout(() => {
          if (!fit) return '';
          return `Fitted exponent $n$ = ${v.fix(fit.slope, 2)} ± ${v.fix(fit.seSlope, 2)} (standard error, 5 degrees of freedom) · $r^2$ = ${v.fix(fit.r2, 3)} · the last simulated judge had $n$ = ${v.fix(last, 2)} · judging by area would give $n$ = 1 · estimated number for area 4 = ${v.fix(Math.pow(10, fit.predict(Math.log10(4))), 0)} (a square four times the standard)`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num:'3.2',kind:'Law',name:'Stevens’ power law',
      statement:String.raw`A power function is an empirical model of reported sensory magnitude over specified stimulus conditions: $\psi=kI^n$ for positive stimulus $I$, scale $k>0$ and exponent $n>0$. Equal stimulus ratios then produce equal modeled sensation ratios, and the log–log graph has slope $n$. A compressive exponent is below 1; an expansive one is above 1. This does not establish a universal exponent or a complete theory of sensation.

An effective-stimulus offset changes the model to $\psi=k(I-I_0)^n$ for $I>I_0$. Its log–log slope against the **unshifted** stimulus is $nI/(I-I_0)$, which is greater than $n$ when $I_0>0$ and approaches $n$ at high intensity. An effective offset need not equal an experimentally measured detection threshold.`,
      idea:String.raw`Taking logarithms of the unshifted model gives $\log\psi=\log k+n\log I$. For the offset family, logarithmic differentiation gives $d\log\psi/d\log I=nI/(I-I_0)$. Thus an offset bends the curve upward in slope near its positive boundary. A doubling from $I=1$ to 2 produces $((2-I_0)/(1-I_0))^n$, which equals $2^n$ only at zero offset.

Stevens' account treats exponents as empirical averages that depend on the continuum and conditions. The displayed normalization sets $\psi(1)=10$; it fixes a reference unit, not an observed universal scale.`,
      caption:String.raw`Choose an exponent or a historical preset and toggle the effective offset. The ordinary plot shows the modeled magnitude through $I=4$. The log–log plot compares the same family with the zero-offset line; gold points are the exact values at 1 and 2. Its finite lower endpoint is the larger of 0.1 and $I_0+0.02(1-I_0)$, so it does not pretend to draw the divergent log slope at the boundary. Readouts distinguish the local slopes, the 1-to-2 secant slope and the stimulus level that doubles magnitude relative to $I=1$.`,
      deps:['psych-3.1','psych-1.11'],refs:['S. S. Stevens (1961), The Psychophysics of Sensory Function, pp.10–17 and24–25'],tags:['power law','Stevens','effective stimulus'],
      credit:'S. S. Stevens (1961), The Psychophysics of Sensory Function, in Sensory Communication, pp.1–33',
      scope:String.raw`The curves and continuous exponent/offset controls are authored illustrations. Presets select identified historical examples described in 3.3; changing the exponent does not change the physical kind of stimulus. This display contains no measured observations. The offset branch is defined only above its boundary and is drawn as zero below it on the ordinary plot. A finite log window cannot include zero sensation.`,
      links:{source:'https://hci.stanford.edu/courses/cs448b/papers/Stevens_Psychophysics.pdf'},verify:false,
      viz(v){
        const preset=v.select('historical example',['bright','loud','len','heavy','shock'].map(id=>({value:id,label:EXP[id].short+' '+EXP[id].n})),'loud',{onChange:id=>exponent.set(EXP[id].n)}),exponent=v.slider('exponent n',.2,3.6,.6,{step:'any',decimals:6}),offsetOn=v.toggle('effective offset',false),offset=v.slider('effective offset I₀',0,.6,.3,{step:'any',decimals:6});
        const A=v.stage({x:[-.2,4.2],y:[-1,15],height:300,minWidth:260,axes:'box',gutter:true,xlabel:'relative stimulus I',ylabel:'modeled magnitude',title:'ordinary coordinates'}),B=v.stage({x:[-1.1,.7],y:[-1,2],height:300,minWidth:260,axes:'box',gutter:true,xlabel:'log₁₀ stimulus I',ylabel:'log₁₀ modeled magnitude',title:'offset changes the log slope'});let info;
        v.legend([['accent','selected power family'],['muted','same n, zero offset',{dash:true}],['gold','I = 1 and 2',{dot:true}]]);
        v.render(()=>{const p=shiftedPower(exponent.value,offsetOn.value?offset.value:0);offset.el.hidden=!offsetOn.value;const value=I=>I>p.offset?10*((I-p.offset)/(1-p.offset))**p.n:0;A.setView([-.2,4.2],[-.12*p.atFour,1.12*p.atFour]);A.fn(value,{domain:[0,4],n:241,color:'accent',width:2.5});for(const I of[1,2])A.dot(I,value(I),{r:5,color:'gold'});B.setView(p.x,p.y);B.path(p.baseline,{color:'muted',dash:[4,4],width:1.3});B.path(p.curve,{color:'accent',width:2.5});for(const I of[1,2])B.dot(Math.log10(I),Math.log10(value(I)),{r:5,color:'gold'});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `n=${v.fix(p.n,6)}, effective offset=${v.fix(p.offset,6)}. Magnitudes at I=1 and 2: ${v.fix(p.atOne,6)}, ${v.fix(p.atTwo,6)}; ratio ${v.fix(p.ratio,6)} (2ⁿ=${v.fix(2**p.n,6)} at zero offset). Local log slopes: ${v.fix(p.slopeOne,6)} at1 and ${v.fix(p.slopeTwo,6)} at2; secant ${v.fix(p.secant,6)}. Magnitude doubles relative to I=1 at I=${v.fix(p.doubling,6)}. Log curve starts at I=${v.fix(p.lower,6)}.`;});
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num:'3.3',kind:'Concept',name:'Exponents across sensory continua',
      statement:String.raw`Historical power-law exponents describe a sensory attribute **and a specified stimulus variable**. Stevens' 1961 Table 2 gives brightness 0.33 for a $5^\circ$ target with a dark-adapted eye, binaural loudness 0.6 as a function of sound pressure, lifted-weight heaviness 1.45, warmth on the arm 1.6 and electric shock 3.5 for 60-cycle current through the fingers. The same source's apparent-length example uses about 1.1.

The gallery also includes area 0.7 from Stevens and Guirao's 1963 original abstract. Stevens and Harris' 1962 abstract reports roughness about $-1.5$ against **grit number**; the positive 1.5 here uses its reciprocal as the stimulus coordinate. The exponent's sign or size is meaningless without naming that coordinate.`,
      idea:String.raw`For $\psi=kI^n$, changing intensity by factor $r$ multiplies modeled magnitude by $r^n$, and magnitude doubles after factor $2^{1/n}$. All gallery curves use the authored reference $\psi(1)=10$, allowing the slopes to be compared without equating the actual units of sound, temperature or weight.

Stevens explicitly described his table as tentative, with average exponents that need not fit an individual. These historical examples do not prove that one exponent is an immutable property of a sense or explain why its value takes that form.`,
      caption:String.raw`Select a continuum and change the stimulus ratio. The left panel shows one reference decade of each power function in log coordinates; the selected curve is blue. The bars show the exponents and their predicted ratios. The curve and ratios are computations from historical illustrative coefficients, not a redrawing of original participant data or a claim of validity across the whole displayed decade.`,
      deps:['psych-3.2'],refs:['Stevens (1961), pp.12–13, Table 2','Stevens and Guirao (1963), original abstract, J. Exp. Psychol.66:177–186','Stevens and Harris (1962), original abstract, J. Exp. Psychol.64:489–494'],tags:['power law','exponents','stimulus conditions'],
      credit:'S. S. Stevens (1961), Sensory Communication pp.12–13; area: Stevens and Guirao (1963); inverse-grit roughness: Stevens and Harris (1962)',
      scope:String.raw`Brightness, smell, saccharin, vibration, pressure, lightness, sucrose, heaviness, warmth and shock are transcribed from the actual 1961 Table 2; length is its p.12 example. Area and roughness use the identified original abstracts; the full 1962/1963 papers are not represented as read. The original current, temperature, chemical concentration and stimulus geometry are not reproduced here, and the screen does not deliver those stimuli. No functional adaptation or danger-resolution explanation is inferred.`,
      links:{source:'https://hci.stanford.edu/courses/cs448b/papers/Stevens_Psychophysics.pdf',area:'https://doi.org/10.1037/h0044984',roughness:'https://doi.org/10.1037/h0042621'},verify:false,
      viz(v){
        const selected=v.select('continuum',EXPS.map(e=>({value:e.id,label:e.short})),'loud'),ratio=v.slider('stimulus ratio r',1.2,10,2,{step:'any',decimals:6}),rows=EXPS.slice().sort((a,b)=>a.n-b.n),N=rows.length;
        const A=v.stage({x:[-.08,1.08],y:[.75,4.75],height:360,minWidth:260,axes:'box',gutter:true,xlabel:'log₁₀ stimulus / reference',ylabel:'log₁₀ modeled magnitude',title:'one decade, common reference'}),B=v.stage({x:[-4.7,8],y:[-.4,N+.6],height:390,minWidth:260,axes:false,title:'exponents and predicted ratios'});let info;
        v.legend([['accent','selected'],['muted','other examples'],['muted','n = 1',{dash:true}]]);
        v.render(()=>{const chosen=EXP[selected.value];for(const e of EXPS)A.line(0,1,1,1+e.n,{color:e===chosen?'accent':'muted',width:e===chosen?2.6:1.2,alpha:e===chosen?1:.45});A.dot(Math.log10(ratio.value),1+chosen.n*Math.log10(ratio.value),{r:5,color:'gold'});B.line(1,0,1,N,{color:'muted',dash:[4,4]});for(const[e,i]of rows.map((e,i)=>[e,i])){const y=N-i-.5,on=e===chosen;B.rect(0,y-.28,e.n,y+.28,{fill:on?'accent':'muted',fillAlpha:on?.7:.3,stroke:false});B.text(e.short,-.14,y,{align:'right',size:10,color:'ink'});B.text(`${e.n} (×${(ratio.value**e.n).toPrecision(3)})`,e.n+.12,y,{size:10,color:on?'accent':'muted'});}info=chosen;});
        v.readout(()=>info?`${info.name}: n=${info.n}. A stimulus factor ${v.fix(ratio.value,6)} gives modeled factor ${v.fix(ratio.value**info.n,6)}. Doubling the stimulus gives ${v.fix(2**info.n,6)}; magnitude doubles after factor ${v.fix(2**(1/info.n),6)}.`:'');
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num:'3.4',kind:'Method',name:'Cross-modality matching',
      statement:String.raw`Cross-modality matching asks an observer to adjust one kind of stimulus until its apparent magnitude matches another. Under the joint model $\psi_A=k_AI_A^a$ and $\psi_B=k_BI_B^b$, equating the modeled magnitudes gives
$$\log I_B=(a/b)\log I_A+\mathrm{constant}.$$
Thus the log–log matching slope is the exponent ratio. This is a conditional prediction that can be compared with observations obtained without numerical magnitude estimates; the algebra alone does not establish that real observers equate one common internal scale.`,
      idea:String.raw`Normalize the two scales at magnitude 10 and let $t=\log_{10}(\psi/10)$. An exact match has $x=\log_{10}I_A=t/a$ and $y=\log_{10}I_B=t/b$. Ratios also compose: $(a/b)(b/c)=a/c$.

Stevens' 1961 account describes reciprocal adjustment experiments, approximate agreement with magnitude-based predictions and a centering tendency that depends on which stimulus is adjusted. The authored simulation places independent Gaussian perturbations in the adjusted stimulus's log-sensation coordinate. Noise in the plotted horizontal variable can flatten ordinary least squares on average; an individual finite sample need not follow that tendency. A reciprocal fitted slope and a geometric mean of slopes are not generally unbiased estimators.`,
      caption:String.raw`Choose two historical examples and a noise level. The left panel uses a gold handle to select one modeled sensation, with the corresponding stimulus levels shown on both curves. On the right, blue trials adjust B and orange trials adjust A. The green line fits B-on-A for the blue trials; the dashed line is the exact a/b prediction. The integer seed makes trials repeatable; Next sample advances it. Bounds include every actual trial and the fitted line. These nine-trial samples and their noise are authored, not Stevens' measurements.`,
      deps:['psych-3.2'],see:['psych-3.3'],refs:['Stevens (1961), pp.14–17, Cross-Modality Comparisons and Figure 5'],tags:['cross-modality matching','power law','regression'],
      credit:'S. S. Stevens (1961), The Psychophysics of Sensory Function, pp.14–17; seeded demonstration authored here',
      scope:String.raw`The common power-law scale and fixed exponents are assumptions. The simulation's noise is neither a fitted participant model nor proof of a biological regression mechanism. The source's reciprocal loudness/vibration experiment had ten observers and is described separately from this example. Negative or zero fitted slopes, if they occur in a finite sample, are reported without taking an invalid logarithm or claiming a meaningful positive geometric compromise.`,
      links:{source:'https://hci.stanford.edu/courses/cs448b/papers/Stevens_Psychophysics.pdf'},verify:false,
      viz(v){
        const ids=['bright','loud','len','heavy','shock'],opts=ids.map(id=>({value:id,label:EXP[id].short})),a=v.select('standard A',opts,'loud'),b=v.select('adjusted B',opts,'len'),noise=v.slider('noise in log₁₀ sensation',0,.25,.06,{step:'any',decimals:6}),seed=v.slider('sample seed',1,999999,8,{int:true});v.button('Next sample',()=>seed.set(seed.value===999999?1:seed.value+1));
        const A=v.stage({x:[-.5,7],y:[.6,3.4],height:330,minWidth:260,axes:'box',gutter:true,xlabel:'log₁₀ stimulus / reference',ylabel:'log₁₀ modeled magnitude',title:'two conditional power laws'}),B=v.stage({x:[-.5,7],y:[-.5,7],height:330,minWidth:260,axes:'box',gutter:true,xlabel:'log₁₀ stimulus A / reference',ylabel:'log₁₀ stimulus B / reference',title:'seeded reciprocal adjustments'}),h=A.handle(0,2,{r:7,color:'gold',constrain:(_,y)=>[0,v.M.clamp(y,1,3)]});let info;
        v.legend([['accent','A / B adjusted',{dot:true}],['orange','B / A adjusted',{dot:true}],['green','blue-trial fit'],['muted','a/b prediction',{dash:true}]]);
        v.render(()=>{const p=matching(EXP[a.value].n,EXP[b.value].n,noise.value,seed.value),max=Math.max(2/p.a,2/p.b),xa=(h.y-1)/p.a,xb=(h.y-1)/p.b;A.setView([-.15*max,1.15*max],[.6,3.4]);A.line(0,1,2/p.a,3,{color:'accent',width:2.5});A.line(0,1,2/p.b,3,{color:'orange',width:2.5});A.line(0,h.y,Math.max(xa,xb),h.y,{color:'gold',dash:[3,3]});A.dot(xa,h.y,{r:5,color:'accent'});A.dot(xb,h.y,{r:5,color:'orange'});B.setView(p.x,p.y);B.line(0,0,2/p.a,2/p.b,{color:'muted',dash:[4,4],width:1.4});B.path(p.fit,{color:'green',width:2});for(const[x,y]of p.AB)B.dot(x,y,{r:4,color:'accent',ring:false});for(const[x,y]of p.BA)B.dot(x,y,{r:4,color:'orange',ring:false});B.dot(xa,xb,{r:7,color:'gold',hollow:true});info={...p,xa,xb,level:h.y};});
        v.readout(()=>{if(!info)return'';const p=info,show=x=>x===null?'undefined for this sample':v.fix(x,6);return `a=${p.a}, b=${p.b}; exact predicted slope a/b=${show(p.predicted)}. Selected log magnitude ${show(p.level)}: log stimulus A=${show(p.xa)}, B=${show(p.xb)}. Blue-trial B-on-A slope ${show(p.forward.slope)}; orange-trial B-on-A slope ${show(p.pooledReverse.slope)}. Reciprocal of orange A-on-B slope ${show(p.inverse)}; geometric combination ${show(p.geometric)}. Seed ${p.seed}, nine trials per direction; finite sample summaries.`;});
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Paradox',
      name: 'Fechner versus Stevens: which psychophysical law?',
      statement: String.raw`Two scales of sensation can be built for the same stimulus continuum. **Fechner's scale** counts just-noticeable differences (psych-1.2) upward from threshold; if Weber's law holds (psych-1.9, $\Delta I=wI$) the count after $N$ steps is $I_N=I_0(1+w)^N$, so $N=\ln(I/I_0)/\ln(1+w)$: a logarithm (psych-1.11). **Stevens' scale** comes from direct ratio judgments (3.1), and gives a power function $\psi=I^{\,n}$ (3.2). The two scales have different shapes for the same observer and the same stimuli, which seems to contradict the idea that a JND is a fixed unit of sensation. The resolution is that they measure different things: if the noise that limits discrimination grows in proportion to the sensation, equal JND steps are *not* equal sensation steps, and a Weber-law observer can have both a logarithmic JND count and a power-law magnitude scale. If instead discrimination noise were constant in sensation units, JND steps would be equal steps of $\psi$, the two scales would coincide, and Weber's law would fail.`,
      idea: String.raw`Fechner's derivation integrates $d\psi=dI/(wI)$, which assumes that one JND is a constant increment of sensation. Stevens' data say that $\psi=I^n$, for which $d\psi=n\,\psi\,dI/I$: if $\Delta I/I$ is constant at threshold (Weber), then the sensation difference that is just noticeable is *proportional to the sensation level*. Both laws can therefore be right about their data, but they are not scales of the same thing: one counts discriminable steps, the other records ratio judgments, and which of the two is “sensation” is partly a matter of definition. This is the standard way of reading the dispute; it does not say which scale is the right one for other purposes.`,
      caption: String.raw`A simulated observer has $\psi=I^n$ (the magnitude-estimation scale). **Left:** the two scales, each normalised to 1 at $I=1000$: **blue** is the power law, **orange** the count of JND steps up from $I=1$. With *discrimination noise $\propto\psi$* (Weber's law holds) they differ: the JND count is a logarithm. Switch to *noise constant in $\psi$* and the curves fall on top of each other, but the **right** panel shows the price: the Weber fraction $\Delta I/I$ falls with intensity, as $I^{-n}$, and Weber's law fails. Drag the **gold** handle to compare the two scales at a given intensity. This is a model, not data.`,
      deps: ['psych-1.11', 'psych-3.2'],
      refs: ['Gescheider ch. 13', 'Gescheider ch. 14'],
      tags: ['Fechner', 'Stevens', 'JND', 'Weber'],
      credit: 'Debate between Fechner (1860) and S. S. Stevens (1957; “To honor Fechner and repeal his law”, Science 133, 1961: 80–86)',
      scope: String.raw`A schematic observer with a power-law sensation and a single noise source. Real discrimination data show Weber fractions that vary with intensity (psych-1.10) and judgment data that depend on procedure, so neither scale is a pure measure of one underlying quantity.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Weber%E2%80%93Fechner_law' },
      viz(v) {
        const M = v.M, IMAX = 1000;
        const nSl = v.slider('magnitude exponent $n$', 0.2, 1.2, 0.67, { step: 0.01 });
        const wSl = v.slider('Weber fraction $w$ at $I=30$', 0.02, 0.3, 0.1, { step: 0.005 });
        const mode = v.select('discrimination noise', [{ value: 'prop', label: 'proportional to $\\psi$ (Weber holds)' }, { value: 'const', label: 'constant in $\\psi$' }], 'prop');
        const sc = v.stage({ x: [0, IMAX], y: [0, 1.05], axes: 'box', gutter: true, height: 320, weight: 1.05, minWidth: 290, xlabel: 'stimulus intensity $I$ (threshold = 1)', ylabel: 'sensation scale (normalised)', title: 'two scales for one observer' });
        const wb = v.stage({ x: [0, 3], y: [0, 0.4], axes: 'box', gutter: true, height: 320, weight: 0.95, minWidth: 260, xlabel: 'stimulus intensity $I$', ylabel: 'Weber fraction $\\Delta I/I$', xticks: logTicks(0, 3, { mult: [1, 3] }), title: 'the Weber plot of the same observer' });
        const hd = sc.handle(150, 0, { color: 'gold', r: 8, constrain: (x) => [M.clamp(x, 2, IMAX), 0] });
        v.legend([['blue', 'magnitude estimation $\\psi=I^n$'], ['orange', 'JND count (Fechner)'], ['gold', 'chosen $I$', { dot: true }]]);
        let st = null;
        v.render(() => {
          const n = nSl.value, w = wSl.value, prop = mode.value === 'prop', c = Math.pow(30, n) * (Math.pow(1 + w, n) - 1);
          const cnt = prop ? (I) => Math.log(I) / Math.log(1 + w) : (I) => (Math.pow(I, n) - 1) / c;
          const C = cnt(IMAX), ME = (I) => Math.pow(I / IMAX, n), FE = (I) => cnt(I) / C;
          sc.fn(ME, { domain: [1, IMAX], color: 'blue', width: 3, n: 260 });
          sc.fn(FE, { domain: [1, IMAX], color: 'orange', width: 3, n: 260, dash: prop ? undefined : [6, 4] });
          const I = hd.x; sc.line(I, 0, I, Math.max(ME(I), FE(I)), { color: 'gold', dash: [3, 3] });
          sc.dot(I, ME(I), { r: 5.5, color: 'blue' }); sc.dot(I, FE(I), { r: 5.5, color: 'orange' });
          const wf = (J) => (prop ? w : (Math.pow(Math.pow(J, n) + c, 1 / n) - J) / J);
          const top = Math.max(0.1, wf(1) * 1.12); wb.setView([0, 3], [0, top]);
          wb.fn((x) => wf(Math.pow(10, x)), { domain: [0, 3], color: prop ? 'green' : 'red', width: 3, n: 200 });
          wb.text(prop ? 'Weber’s law: constant' : 'falls as I^−n: Weber’s law fails', 1.5, wf(30), { dy: -14, align: 'center', size: 12, weight: 700, color: prop ? 'green' : 'red' });
          st = { n, w, prop, I, me: ME(I), fe: FE(I), C, w1: wf(1), w1000: wf(IMAX) };
        });
        v.readout(() => st ? `At $I$ = ${v.fix(st.I, 0)}: magnitude scale ${v.fix(st.me, 3)}, JND-count scale ${v.fix(st.fe, 3)} (difference ${v.fix(Math.abs(st.me - st.fe), 3)}) · total JNDs between $I=1$ and $1000$: ${v.fix(st.C, 0)} · Weber fraction at $I=1$: ${v.fix(st.w1, 3)}, at $I=1000$: ${v.fix(st.w1000, 3)} · ${st.prop ? `a tenfold rise in $I$ multiplies the magnitude estimate by $10^n$ = ${v.fix(Math.pow(10, st.n), 2)} but adds a fixed $\\ln 10/\\ln(1+w)$ = ${v.fix(Math.log(10) / Math.log(1 + st.w), 1)} JNDs` : 'the two scales coincide, Weber’s law fails'}` : '');
      },
    },
  ],
};
