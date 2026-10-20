import { cornsweet, anchors, fading } from './source-audit-lightness.js';
// Psychology & Perception — Chapter 4: Early vision (items 4.11–4.14)
import { grey, clamp01, logistic, smooth01, logTicks, BLIND } from './ch04.shared.js';

export default {
  collection: 'psych',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.11
    {
      num:'4.11',kind:'Phenomenon',name:'Craik–O’Brien–Cornsweet illusion',
      statement:String.raw`Regions with the same luminance can appear different in brightness when their boundary contains opposing light and dark gradients. The territory adjoining the bright gradient can appear lighter than the territory adjoining the dark gradient. This is an appearance, not an actual difference in their remote luminances. Context changes its strength: the experiments of Purves, Shimpi and Lotto (1999) varied scene cues while retaining the edge profile.

This illustration uses an authored **compact** cusp: its two tails reach exactly the common background before the displayed endpoints. The alternative is a real step with unequal endpoint levels. The graph reports a discrete edge-selection calculation separately from either your perception or the source's empirical explanation.`,
      idea:String.raw`The authored sample row has spacing $\Delta x=0.02$. Retain an adjacent increment only if $|L_{i+1}-L_i|/\Delta x\ge c$, then cumulatively sum the retained increments. Add one constant so the reconstructed endpoint mean is 0.5. At $c=0$, every increment is retained and telescoping reconstructs the sampled input up to that constant.

A high cutoff can retain the central jump while discarding gradual tails. A grey cover also creates its own boundary increments, so partial covering need not remove the model difference. A centred cover spanning both complete cusp tails makes the input uniform and its reconstructed difference zero. Neither result identifies the mechanism of human brightness perception. The cited paper investigates contextual/empirical explanations; it is not the source of this thresholding algorithm.`,
      caption:String.raw`Choose the compact cusp or a real step. Move the gold cover handle or its position slider; adjust its half-width and toggle it. The top panel plots every input sample and its reconstructed value. The strips encode the same two arrays as greys. The readout compares the actual endpoints at 0 and 10, rather than calling finite exponential tails equal or labeling a computed difference “your illusion.” At cutoff zero, compare the reconstructed profile with the input.`,
      deps:['psych-4.6'],refs:['Purves, Shimpi and Lotto (1999), An Empirical Explanation of the Cornsweet Effect, methods, Figure2, results and discussion'],tags:['Cornsweet','edge integration','brightness'],
      credit:'Dale Purves, Amita Shimpi and R. Beau Lotto (1999), Journal of Neuroscience19:8542–8551; finite cusp/threshold calculation authored here',
      scope:String.raw`The compact quadratic tails, relative levels, sample spacing, cover and hard cutoff are authored. Segments between samples are an interpolated drawing of a finite computation; this is not an exact continuous differentiation or a calibrated luminance display. Grey encoding clips reconstructed samples outside[0,1]; the numeric graph and clipping count disclose that explicitly. No historical first-discovery claim, measured illusion magnitude, unique neural mechanism or guaranteed subjective disappearance is asserted.`,
      links:{source:'https://doi.org/10.1523/JNEUROSCI.19-19-08542.1999',text:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6783017/'},verify:false,
      viz(v){
        const shape=v.select('profile',[{value:'cusp',label:'compact cusp'},{value:'step',label:'real step'}],'cusp'),a=v.slider('edge amplitude',.04,.3,.16,{step:'any',decimals:6}),w=v.slider('tail length',.3,3,1.4,{step:'any',decimals:6}),c=v.slider('cover centre',2.5,7.5,5,{step:'any',decimals:6}),half=v.slider('cover half-width',0,2.5,.8,{step:'any',decimals:6}),cut=v.slider('increment / spacing cutoff',0,1.5,.35,{step:'any',decimals:6}),cover=v.toggle('cover on',true);
        const A=v.stage({x:[-.5,10.5],y:[.1,.9],height:300,minWidth:260,axes:'box',gutter:true,xlabel:'authored position',ylabel:'sample / reconstruction value',title:'finite sampled profiles'}),B=v.stage({x:[-.2,10.2],y:[-.2,2.2],height:160,minWidth:260,axes:false,title:'input (top), reconstructed encoding (bottom)'}),h=A.handle(5,.15,{r:7,color:'gold',constrain:x=>[v.M.clamp(x,2.5,7.5),h.y],onDrag:h=>c.set(h.x)});let info;
        v.legend([['ink','input'],['green','threshold reconstruction'],['gold','cover extent',{area:true}]]);
        v.render(()=>{const p=cornsweet(a.value,w.value,c.value,half.value,cut.value,cover.value,shape.value),hy=p.y[0]+.1*(p.y[1]-p.y[0]);A.setView([-.5,10.5],p.y);h.set(p.centre,hy);if(p.cover&&p.half>0)A.rect(p.centre-p.half,p.y[0]+.2*(p.y[1]-p.y[0]),p.centre+p.half,p.y[1]-.08*(p.y[1]-p.y[0]),{fill:'gold',fillAlpha:.1,stroke:false});A.path(p.xs.map((x,i)=>[x,p.L[i]]),{color:'ink',width:2.4});A.path(p.xs.map((x,i)=>[x,p.P[i]]),{color:'green',width:2});B.raster((x,y)=>{if(x<0||x>10||y<0||y>2)return null;const i=Math.min(500,Math.floor(x/.02)),g=y>=1?p.L[i]:p.P[i];return[...grey(g),1];},{res:2,key:JSON.stringify([p.a,p.w,p.centre,p.half,p.cutoff,p.cover,p.shape])});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Endpoint input values ${v.fix(p.L[0],9)}, ${v.fix(p.L.at(-1),9)}; physical difference ${v.fix(p.physicalDifference,9)}. Reconstructed endpoint difference ${v.fix(p.modelDifference,9)}. ${p.kept.filter(x=>x!==0).length} nonzero increments retained out of500; ${p.clipped} reconstructed grey samples clipped by the strip encoding. Numeric profile range[${v.fix(p.low,9)}, ${v.fix(p.high,9)}]. These are model values, not a perceptual measurement.`;});
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num:'4.12',kind:'Phenomenon',name:'Lightness constancy and the anchoring problem',
      statement:String.raw`For an ideal diffuse surface, reflected luminance is proportional to reflectance times illumination. Under a common illuminant, luminance ratios preserve reflectance ratios, but the absolute reflectance scale remains ambiguous. Human lightness constancy is the partial stability of surface appearance despite changing illumination.

Gilchrist and colleagues' 1999 theory combines anchoring within local and global frameworks. In its simple highest-luminance rule, $P=0.9L/L_{\max}$ assigns a reference white and scales other patches relative to it. Their full account also includes grouping, relative area and scale normalization; highest luminance and the anchor are not universally identical.`,
      idea:String.raw`The authored row has reflectances $R_i$ and selected illumination factors $E_i$, giving relative luminances $L_i=R_iE_i$. Compute two simple assignments: $P_{i,\ell}=0.9L_i/L_{\max,local}$ and $P_{i,g}=0.9L_i/L_{\max,global}$. The displayed convex combination is
$$P_i=wP_{i,\ell}+(1-w)P_{i,g}.
$$
Here $0\le w\le1$ and $\ell,g$ denote local and global assignments.
The weight is an authored control, not estimated from grouping cues.

Full local weighting removes the illumination multiplier within each framework, but it recovers true reflectance only when that framework's maximum reflectance is the chosen reference 0.9. A group lacking that reference can remain incorrectly anchored. At illumination factor1, this illustration merges the equal-illumination groups and returns the original reflectances.`,
      caption:String.raw`Move the six-patch spotlight and change its strength. Top: encoded relative luminances. Bottom: the convex-mixture assignments. The other panel plots every **unclipped** model assignment against true reflectance on log coordinates; its bounds follow the actual values. Change local weight to compare the two anchors. A white reference need not be present in each moving framework, so local weight1 does not promise perfect constancy. The scene, reflectances, known illumination boundary and weights are authored.`,
      deps:['psych-4.1'],refs:['Gilchrist et al. (1999), pp.804–805, Equations1–3 and local/global weighting discussion'],tags:['lightness constancy','anchoring','illumination'],
      credit:'Alan Gilchrist and eight coauthors (1999), An anchoring theory of lightness perception, Psychological Review106(4):795–834',
      scope:String.raw`This uses a specified partition and normalized positive weights in a simple illustrative submodel. The source's p.805 printed Equation3 shows W−1 in its global coefficient; its surrounding prose calls the combination a weighted average. The authored formula explicitly uses w and1−w and is not presented as a transcription of that printed expression. Area effects, inferred grouping, self-luminosity and scale normalization are omitted. Display greys use an authored exponent0.45 and relative normalization; they are not calibrated luminances or measurements of appearance.`,
      links:{source:'https://www2.psy.unsw.edu.au/users/bspehar/download/spehar_anchoring_1999.pdf'},verify:false,
      viz(v){
        const strength=v.slider('spotlight factor',1,30,10,{step:'any',decimals:6}),weight=v.slider('local weight',0,1,.9,{step:'any',decimals:6}),centre=v.slider('spotlight centre',3,11,7,{int:true});
        const A=v.stage({x:[-1,15],y:[-.7,6.4],height:330,minWidth:260,axes:false,title:'relative luminance and assigned reflectance'}),B=v.stage({x:[-3,0],y:[-3,0],height:330,minWidth:260,axes:'box',gutter:true,xlabel:'log₁₀ true reflectance',ylabel:'log₁₀ model assignment',title:'all actual model values'}),h=A.handle(7,5.6,{r:7,color:'gold',constrain:x=>[v.M.clamp(Math.round(x),3,11),5.6],onDrag:h=>centre.set(h.x)});let info;
        v.legend([['orange','in spotlight',{dot:true}],['accent','outside',{dot:true}],['muted','perfect assignment',{dash:true}]]);
        v.render(()=>{const p=anchors(strength.value,weight.value,centre.value);h.set(p.centre,5.6);A.rect(p.centre-3,4.4,p.centre+3,5.1,{fill:'gold',fillAlpha:.2,stroke:false});for(let i=0;i<14;i++){A.rect(i+.08,2.7,i+.92,3.8,{fill:grey((p.L[i]/p.global)**.45),fillAlpha:1,color:p.lit[i]?'orange':'muted',width:1});A.rect(i+.08,.7,i+.92,1.8,{fill:grey((p.P[i]/.9)**.45),fillAlpha:1,color:'muted',width:1});}A.text('relative input',7,4.05,{align:'center',size:11,color:'ink'});A.text('assigned reflectance',7,2.1,{align:'center',size:11,color:'ink'});B.setView(p.x,p.x);B.line(p.x[0]+.03,p.x[0]+.03,p.x[1]-.03,p.x[1]-.03,{color:'muted',dash:[4,4]});for(let i=0;i<14;i++)B.dot(Math.log10(p.R[i]),Math.log10(p.P[i]),{r:4,color:p.lit[i]?'orange':'accent',ring:false});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Six lit patches; local maximum luminances ${v.fix(p.inside,9)}, ${v.fix(p.outside,9)}; global ${v.fix(p.global,9)}. Relative luminance range ${v.fix(p.rangeL,6)}:1; model range ${v.fix(p.rangeP,6)}:1. Mean absolute log₁₀ assignment error ${v.fix(p.meanAbsLogError,9)}; worst multiplicative error ${v.fix(10**p.worstLogError,9)}. These assignments are not observations of your perception.`;});
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Phenomenon',
      name: 'The blind spot and perceptual filling-in',
      statement: String.raw`Each eye has a region, the **optic disc**, where the optic nerve leaves the retina and there are no photoreceptors. It lies about $15^\circ$ toward the nose from the fovea, so in the visual field it is about $12$–$15^\circ$ to the temporal side of fixation, roughly $5^\circ$ wide and $7^\circ$ high. A small object falling entirely inside it cannot be seen, yet we do not see a hole: the region is **filled in** with the surrounding colour, texture or line, so that a line crossing it looks continuous. Seeing with the hole filled is done by the brain, not by the eye.`,
      idea: String.raw`The retinal image has no information at the disc, and the other eye usually covers it. The visual system infers the content of a missing area from its surroundings (a continuation of edges, textures and colour, as for natural images), so what is "seen" there is a guess based on the neighbouring surface. Because filling-in uses the surround, objects larger than the disc are only partly erased and a small object lying across the disc's edge appears as a crescent. Mariotte first described the blind spot in 1668.`,
      caption: String.raw`**Top:** the visual field of your right eye (cover the left, fix your gaze on the red cross) with the blind spot outlined. Drag the **gold** dot into the outlined ellipse and change its size, or switch the eye. **Bottom:** what the model says you perceive: the region of the blind spot is filled with the surround's pattern, and the dot (if any of it is visible) is cut off at the edge of the hole. To try it for real, put the page at arm's length, cover the left eye, look at the cross and slide your head closer or farther until the dot vanishes. The size and position of the ellipse are typical textbook values and vary between people; you can calibrate them from the point where the dot vanishes.`,
      deps: ['psych-4.1'],
      refs: ['Goldstein ch. 2'],
      tags: ['blind spot', 'filling-in', 'optic disc'],
      credit: 'Edme Mariotte, 1668 (blind spot); Ramachandran & Gregory, 1991, Nature 350: 699–702 (filling-in of artificial scotomas)',
      scope: String.raw`The size and position vary between people and with the measurement method (horizontal diameter estimates range from about 3° to 7°); the pattern completion depends on the pattern: smooth lines and textures fill well, while complex or large patterns may not.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Blind_spot_(vision)' },
      verify: true,
      viz(v) {
        const eye = v.select('Eye', [{ value: 'R', label: 'right eye' }, { value: 'L', label: 'left eye' }], 'R');
        const pat = v.select('Surround', [{ value: 'plain', label: 'plain' }, { value: 'stripes', label: 'stripes' }, { value: 'line', label: 'line' }, { value: 'color', label: 'colour' }], 'stripes');
        const rd = v.slider('dot radius (degrees)', 0.4, 6, 1.5, { step: 0.05 });
        const FX = [-12, 30], FY = [-16, 16];
        const top = v.stage({ x: FX, y: FY, equal: true, axes: false, height: 290, weight: 1.4, minWidth: 340, title: 'the screen' });
        const bot = v.stage({ x: FX, y: FY, equal: true, axes: false, height: 290, weight: 1.4, minWidth: 340, title: 'what you perceive (model)' });
        const hd = top.handle(15.5, -1.5, { color: 'gold', r: 7, label: 'dot', labelPos: 'n' });
        const bx = () => (eye.value === 'R' ? BLIND.x : -BLIND.x);
        const bg = (x, y, p) => {
          if (p === 'plain') return [205, 205, 195];
          if (p === 'stripes') return Math.floor((x + 100) / 1.6) % 2 === 0 ? [215, 215, 205] : [90, 100, 130];
          if (p === 'line') return Math.abs(y - BLIND.y) < 0.45 ? [30, 30, 40] : [215, 215, 205];
          return [60 + 20 * Math.sin(x / 6), 150 + 40 * Math.sin(y / 5), 90 + 20 * Math.cos(x / 9)];
        };
        const inHole = (x, y) => ((x - bx()) / BLIND.rx) ** 2 + ((y - BLIND.y) / BLIND.ry) ** 2 <= 1;
        let info = null;
        v.render(() => {
          const p = pat.value, r = rd.value, dx = hd.x, dy = hd.y;
          const isDot = (x, y) => (x - dx) ** 2 + (y - dy) ** 2 <= r * r;
          top.raster((x, y) => [...(isDot(x, y) ? [20, 20, 20] : bg(x, y, p)), 1], { res: 3, key: `T${p}|${dx.toFixed(2)}|${dy.toFixed(2)}|${r}|${eye.value}` });
          bot.raster((x, y) => [...(inHole(x, y) ? bg(x, y, p) : isDot(x, y) ? [20, 20, 20] : bg(x, y, p)), 1], { res: 3, key: `B${p}|${dx.toFixed(2)}|${dy.toFixed(2)}|${r}|${eye.value}` });
          const bxv = bx();
          top.curve((t) => [bxv + BLIND.rx * Math.cos(t), BLIND.y + BLIND.ry * Math.sin(t)], 0, 2 * Math.PI, { color: 'red', width: 2, dash: [5, 4] });
          const cross = (s) => { s.line(-1, 0, 1, 0, { color: 'red', width: 2.5 }); s.line(0, -1, 0, 1, { color: 'red', width: 2.5 }); };
          cross(top); cross(bot);
          top.text(eye.value === 'R' ? 'cover the left eye, fix the red cross' : 'cover the right eye, fix the red cross', 9, 14, { align: 'center', size: 11.5, color: 'ink', plate: true });
          let inside = 0, tot = 0;
          for (let a = -r; a <= r; a += r / 12) for (let b = -r; b <= r; b += r / 12) if (a * a + b * b <= r * r) { tot++; if (inHole(dx + a, dy + b)) inside++; }
          info = { f: inside / tot, ecc: Math.hypot(dx, dy) };
        });
        v.readout(() => info ? `Dot at ${v.fix(info.ecc, 1)}° from fixation · **${v.fix(100 * info.f, 0)}%** of it lies inside the blind spot${info.f > 0.999 ? ' — **invisible**; the hole is filled with the surround' : info.f > 0 ? ' — partly visible (the dot is larger than the hole, or straddles its edge)' : ''}` : '');
      },
    },
    // ------------------------------------------------------------------ 4.14
    {
      num:'4.14',kind:'Phenomenon',name:'Troxler fading',
      statement:String.raw`During steady fixation, a peripheral target can fade from awareness and later reappear. Fixational eye movements continue during attempted fixation; the stimulus does not need to be physically removed. Martinez-Conde and colleagues (2006) measured peripheral visibility reports together with eye movements and found microsaccade dynamics associated with transitions toward visibility or fading. That evidence does not make microsaccades the sole possible refresh mechanism.

Retinal stabilization is a related experimental condition, not identical to ordinary fixation. Riggs and colleagues (1953) reported lines beginning to disappear within a few seconds and coarse lines becoming intermittent within a minute; the experiment does not support universal complete disappearance in one or two seconds.`,
      idea:String.raw`A minimal authored adapting unit follows $\tau\dot a=u-a$, with output $r=u-a$ and initial state $a(0)=0$. With constant input $u=1/2$, its exact output is $r(t)=\tfrac12e^{-t/\tau}$. For the illustration's sinusoidal input $u=1/2+A\sin\omega t$, set $D=e^{-t/\tau}$, $\theta=\omega t$ and $z=\omega\tau$. Direct integration gives
$$q=\sin\theta-z\cos\theta+zD,$$
$$a(t)=\frac{1-D}{2}+\frac{Aq}{1+z^2}.$$
The displayed proxy is $\min(1,2|r|)$. Its absolute value and clipping are authored display rules, not a fitted probability of visibility.

The motion/blur controls set $A=0.45M/(M+B)$ and frequency0.8Hz. Six time constants are chosen for illustration. Motion modulates each unit's input mathematically; the dots' positions do not jitter. Every curve is recomputed from the exact initial condition, so changing a control cannot retain incompatible simulation history.`,
      caption:String.raw`Move time to inspect the same model state on the blob diagram and six complete curves. Set input modulation to zero for exponential decay, then raise it to see the high-pass response to varying input. Blur changes the authored modulation amplitude and drawn blob size. The center cross provides a visual reference; these changing opacity proxies do not measure or predict your own fading. The fixed nominal eccentricities are model coordinates, not calibrated angles on your screen.`,
      deps:['ode-1.4'],see:['psych-4.6'],refs:['Riggs, Ratliff, Cornsweet and Cornsweet (1953), pp.495–501, methods/results','Martinez-Conde et al. (2006), Neuron49:297–305, visibility/eye-movement experiment'],tags:['Troxler','adaptation','fixation'],
      credit:'Experimental context: Riggs et al. (1953) and Martinez-Conde et al. (2006); exact adapting-unit illustration authored here',
      scope:String.raw`The formula, sinusoidal refresh, six chosen time constants, opacity mapping, blur relation and nominal locations are an authored model. It is not a reconstruction of stabilized-image optics, an eye tracker, a microsaccade generator or a fit to either study. No universal target-size, eccentricity or blur law and no unread original Troxler1804 priority claim is asserted.`,
      links:{source:'https://doi.org/10.1364/JOSA.43.000495',experiment:'https://smc.neuralcorrelate.com/files/publications/martinez-conde_et_al_neuron06.pdf'},verify:false,
      viz(v){
        const time=v.slider('model time (s)',0,20,3.5,{step:'any',decimals:6}),blur=v.slider('authored blur B',.05,3,1.4,{step:'any',decimals:6}),motion=v.slider('input modulation M',0,.4,.03,{step:'any',decimals:6});v.button('Restart model',()=>time.set(0));
        const A=v.stage({x:[-16,16],y:[-16,16],equal:true,height:340,minWidth:260,axes:false,title:'authored opacity proxies'}),B=v.stage({x:[-1,21],y:[-.15,1.15],height:340,minWidth:260,axes:'box',gutter:true,xlabel:'model time (s)',ylabel:'clipped absolute response proxy',title:'exact adapting-unit responses'}),colors=['accent','orange','green','purple','teal','pink'],angles=[20,105,165,215,285,340].map(x=>x*Math.PI/180);let info;
        v.legend(colors.map((color,i)=>[color,`unit${i+1}`]));
        v.render(()=>{const p=fading(time.value,blur.value,motion.value);for(let i=0;i<6;i++){const x=p.E[i]*Math.cos(angles[i]),y=p.E[i]*Math.sin(angles[i]);for(let ring=8;ring>=1;ring--)A.circle(x,y,.5+.28*ring*(.6+.4*p.blur),{fill:colors[i],fillAlpha:p.units[i].proxy*.1,stroke:false});A.text(String(i+1),x,y,{align:'center',size:11,color:'ink',plate:true});B.path(p.curves[i],{color:colors[i],width:1.7});B.dot(p.time,p.units[i].proxy,{r:3,color:colors[i],ring:false});}A.line(-.8,0,.8,0,{color:'red',width:2});A.line(0,-.8,0,.8,{color:'red',width:2});info=p;});
        v.readout(()=>{if(!info)return'';const p=info;return `Model t=${v.fix(p.time,6)}s; sinusoidal input amplitude ${v.fix(p.amplitude,9)}, frequency0.8Hz. Chosen τ: ${p.taus.map(x=>v.fix(x,6)).join(', ')}s. Current proxies: ${p.units.map((u,i)=>`${i+1}: ${v.fix(u.proxy,9)}`).join('; ')}. Exact formula with a(0)=0; no carried simulation history or measured visibility.`;});
      },
    },
  ],
};
