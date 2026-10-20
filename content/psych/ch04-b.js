// Psychology & Perception — Chapter 4: Early vision (items 4.6–4.10)
import { centreSurround, fieldWeight, machFilter, rampInput } from './source-audit-centresurround.js';
import { logTicks, grey, clamp01, blur1, dog1, blur2, smooth01 } from './ch04.shared.js';

export default {
  collection: 'psych',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num:'4.6',kind:'Concept',name:'Centre–surround receptive fields',
      statement:String.raw`In many retinal ganglion cells, illuminating the receptive-field centre and its surround has opposing effects. ON-centre and OFF-centre describe opposite polarities. Kuffler's cat recordings showed these spatial interactions, but also irregular fields and changes with illumination and adaptation. They do not imply that every ganglion cell has an identical, perfectly concentric field.

A **difference of Gaussians** is one useful spatial model: a narrow positive Gaussian opposed by a broader weighted Gaussian. For unit-integral Gaussians, $w=G_{\sigma_c}-kG_{\sigma_s}$ has total weight $1-k$. A uniform input cancels **exactly in this whole-plane model when $k=1$**, before any baseline or rectification.`,
      idea:String.raw`The authored family uses concentric disks and annuli. A normalized two-dimensional Gaussian assigns a disk of radius $r$ the exact mass
$$F_\sigma(r)=1-e^{-r^2/(2\sigma^2)}.$$
Its disk drive is $D(r)=F_{\sigma_c}(r)-kF_{\sigma_s}(r)$. An annulus from $r$ to $r+1.5$ has drive $D(r+1.5)-D(r)$; a uniform plane has drive $1-k$. The plotting window does not truncate any of these integrals.

The authored rate is $\max(0,20+60sD)$, with polarity $s=+1$ for ON and $s=-1$ for OFF. These baseline/gain values are illustrative. For $k>0$, differentiating the disk drive gives one positive stationary radius; for $k=0$ it increases monotonically. Comparing that stationary point, when inside 0–6, with both endpoints gives the displayed global maximum for the selected polarity. OFF cells need not prefer the ON cell's spot size.`,
      caption:String.raw`The field is an **authored circular spatial weighting**, with red positive and blue negative for the selected polarity. Choose a concentric spot, annulus, or the uniform plane. The gold handle and radius slider change the radius; the diagram uses arbitrary distance units with fixed centre width 0.8. Uniform illumination fills the whole mathematical plane, beyond the displayed window.

The other panel always shows the response to a **centred disk**, including radius zero and six. Green points mark every maximizing candidate; the hollow gold point marks the disk at the selected radius. The readout separately gives the selected annulus or uniform response. No temporal response or measured spike train is reproduced.`,
      deps:['psych-4.4'],refs:['Kuffler (1953), methods and §§4–5, Figures 6/8 and summary','Meister and Berry (1999), The Neural Code of the Retina, pp. 435–439, equations 1–3/Figure 1'],tags:['receptive field','ganglion cell','contrast'],
      credit:'Stephen W. Kuffler (1953), Journal of Neurophysiology 16:37–68; DoG model exposition: Markus Meister and Michael J. Berry II (1999), Neuron 22:435–450',
      scope:String.raw`The source physiology includes irregular receptive-field organization, adaptation, timing and nonlinear effects. The static concentric Gaussian family, whole-plane stimulus, distances, baseline and gain here are authored, not fitted measurements. Reversing polarity reverses the signed drive, while the rectified rate need not be a mirror image. A uniform field at k=1 leaves the authored baseline, rather than suppressing all spiking. The complete spatial filter is not a model of sustained firing under all illumination conditions; no retinal eccentricity law, original Rodieck-paper reading or historical priority is claimed.`,
      links:{source:'https://doi.org/10.1152/jn.1953.16.1.37',exposition:'https://www.cnbc.cmu.edu/~tai/readings/adaptation/meister_berry.pdf'},verify: false,
      viz(v){
        const shape=v.select('concentric stimulus',[{value:'spot',label:'spot'},{value:'ring',label:'annulus'},{value:'full',label:'uniform plane'}],'spot'),rad=v.slider('radius (model units)',0,6,1,{step:'any',decimals:6,fmt:x=>x.toFixed(9)}),ratio=v.slider('surround / centre width',1.5,5,3,{step:'any',decimals:6,fmt:x=>x.toFixed(9)}),k=v.slider('surround weight k',0,1.2,.9,{step:'any',decimals:6,fmt:x=>x.toFixed(9)}),on=v.toggle('ON polarity',true);
        const A=v.stage({x:[-8,8],y:[-8,8],equal:true,height:340,minWidth:260,axes:false,title:'authored signed spatial field'}),B=v.stage({x:[-.4,6.4],y:[-8,101],height:340,minWidth:260,axes:'box',gutter:true,xlabel:'centred-disk radius (model units)',ylabel:'authored rate (spikes/s)',xticks:[0,2,4,6],yticks:[0,20,40,60,80],title:'disk-size curve for selected polarity'});
        const h=A.handle(1,0,{r:8,color:'gold',constrain:x=>[v.M.clamp(x,0,6),0],onDrag:h=>rad.set(h.x)});let info;
        v.legend([['red','positive weight',{area:true}],['blue','negative weight',{area:true}],['gold','selected radius',{dot:true}],['green','global disk maximum',{dot:true}]]);
        v.render(()=>{const p=centreSurround(rad.value,ratio.value,k.value,shape.value,on.value),peak=fieldWeight(0,0,p.sc,p.ss,p.k);A.raster((x,y)=>[...v.diverge(p.sign*fieldWeight(x,y,p.sc,p.ss,p.k)/peak,'blue','red'),1],{res:2,key:JSON.stringify([p.ratio,p.k,p.on])});if(p.shape==='full')A.rect(A.bounds.x[0],A.bounds.y[0],A.bounds.x[1],A.bounds.y[1],{fill:'gold',fillAlpha:.08,stroke:false});else{A.circle(0,0,p.radius,{color:'gold',width:2,fill:p.shape==='spot'?'gold':undefined,fillAlpha:.12});if(p.shape==='ring')A.circle(0,0,p.radius+1.5,{color:'gold',width:2});}h.set(p.radius,0);B.path(p.curve,{color:'accent',width:2.5});B.line(0,20,6,20,{color:'muted',dash:[4,4],width:1});B.dot(p.radius,p.probeDisk,{r:7,color:'gold',hollow:true});for(const q of p.best)B.dot(q.r,q.rate,{r:5,color:'green'});info=p;});
        v.readout(()=>{if(!info)return'';const p=info,f=x=>x.toExponential(7);return `Selected ${p.shape}, ${p.on?'ON':'OFF'} polarity: signed drive ${f(p.drive)}, authored rate ${f(p.rate)} spikes/s. Uniform-plane drive 1−k=${f(p.uniformDrive)}, rate ${f(p.uniformRate)} spikes/s (baseline20).\nCentred-disk rate at radius ${p.radius.toPrecision(10)}: ${f(p.probeDisk)} spikes/s. Global disk maximum on[0,6]: ${p.best.map(q=>`r=${q.r.toPrecision(10)}, rate=${f(q.rate)}`).join('; ')}. ${p.critical===null?'k=0: disk drive is monotone.':`Positive stationary disk radius ${p.critical.toPrecision(10)}; endpoints are included in the comparison.`} These are authored spatial-model values.`;});
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Principle',
      name: 'Lateral inhibition (Hartline–Ratliff)',
      statement: String.raw`Neighbouring receptors inhibit one another, and the inhibition is stronger the closer they are and the more active the inhibiting receptor is. In the eye of the horseshoe crab *Limulus*, where the units can be recorded individually, the steady firing rate $r_p$ of unit $p$ obeys $$r_p=e_p-\sum_{q\ne p}k_{pq}\,\max(r_q-r_q^0,0),$$ where $e_p$ is the excitation from the light on $p$ itself, $k_{pq}$ the inhibitory coupling from $q$ to $p$ (falling with distance) and $r_q^0$ a threshold below which $q$ does not inhibit. Illuminating the neighbours therefore reduces the response of $p$ by an amount that adds up linearly over the neighbours, and the system as a whole responds more to differences in illumination than to its level.`,
      idea: String.raw`The inhibition acts on the *outputs* of the neighbours, which themselves are inhibited, so the equation is a coupled set that must be solved together; above threshold it is linear, $(I+K)\,\mathbf r=\mathbf e-K\mathbf r^0$, and a single matrix solve gives all responses. Hartline and Ratliff measured the couplings by illuminating pairs of units and found the linear sum with a threshold fitted the data. The steady state is not the one-step result $\mathbf e-K\mathbf e$: recurrent inhibition softens the effect, because a strongly inhibited neighbour inhibits less in return.`,
      caption: String.raw`Top: the light on a row of 25 receptors (a **single** lit cell, a **patch** of width $w$, or an **edge**; drag the **gold** handle to move it). Bottom: the steady firing rate from the Hartline–Ratliff equations. The **grey** outline is each unit's response if there were no inhibition. Raise the *strength* and *spread*: a cell in the lit region is driven less when its neighbours are also lit, the units beside a lit patch are suppressed, and at an edge the response overshoots on the bright side and undershoots on the dark side. *Recurrent* solves the equations to a steady state; *one pass* subtracts the neighbours' uninhibited responses. Couplings here are a model (exponential fall-off with distance), not Hartline and Ratliff's measured values.`,
      deps: ['psych-4.6'],
      refs: ['Goldstein ch. 3'],
      tags: ['lateral inhibition', 'Limulus', 'contrast'],
      credit: 'H. K. Hartline & F. Ratliff, 1957, J. Gen. Physiol. 40: 357–376 (Limulus eye); Hartline shared the 1967 Nobel Prize in Physiology or Medicine',
      scope: String.raw`Holds in the steady state for a model that is linear above a threshold, in the lateral eye of *Limulus*; the same architecture is found in the retinas of vertebrates, where it is only qualitatively similar (and acts through horizontal and amacrine cells).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lateral_inhibition' },
      verify: true,
      viz(v) {
        const M = v.M, N = 25;
        const pat = v.select('Light', [{ value: 'one', label: 'single cell' }, { value: 'patch', label: 'patch' }, { value: 'edge', label: 'edge' }], 'edge');
        const kk = v.slider('inhibition strength', 0, 0.5, 0.18, { step: 0.005 });
        const lam = v.slider('spread (receptors)', 0.5, 5, 2, { step: 0.1 });
        const wd = v.slider('patch width $w$', 1, 12, 5, { int: true });
        const mode = v.select('Steady state', [{ value: 'rec', label: 'recurrent (solved)' }, { value: 'one', label: 'one pass' }], 'rec');
        const e0 = 0.35, thr = 0.1;
        const inp = v.stage({ x: [0, N], y: [0, 1.4], axes: false, height: 200, weight: 1.4, minWidth: 340, title: 'light on the receptors' });
        const out = v.stage({ x: [0, N], y: [-0.2, 1.25], axes: false, height: 240, weight: 1.4, minWidth: 340, title: 'steady response' });
        const hd = inp.handle(12.5, 1.2, { color: 'gold', r: 8, label: 'move', labelPos: 'n', constrain: (x) => [Math.min(N - 1, Math.max(1, Math.round(x - 0.5) + 0.5)), 1.2] });
        const Kmat = (k, l) => Array.from({ length: N }, (_, p) => Array.from({ length: N }, (_, q) => (p === q ? 0 : k * Math.exp(-(Math.abs(p - q) - 1) / l) * (Math.abs(p - q) <= 8 ? 1 : 0))));
        const solve = (e, K, rec) => {
          if (!rec) return e.map((x, p) => x - K[p].reduce((a, kq, q) => a + kq * Math.max(e[q] - thr, 0), 0));
          let r = e.slice();
          for (let it = 0; it < 200; it++) { const nr = e.map((x, p) => x - K[p].reduce((a, kq, q) => a + kq * Math.max(r[q] - thr, 0), 0)); const d = nr.reduce((a, x, i) => a + Math.abs(x - r[i]), 0); r = r.map((x, i) => 0.5 * x + 0.5 * nr[i]); if (d < 1e-9) break; }
          return r;
        };
        v.legend([['accent', 'response with inhibition', { area: true }], ['muted', 'response with none', { dash: true }]]);
        let info = null;
        v.render(() => {
          const c = Math.round(hd.x - 0.5), w = wd.value, rec = mode.value === 'rec';
          const e = Array.from({ length: N }, (_, i) => {
            if (pat.value === 'one') return i === c ? 1 : e0;
            if (pat.value === 'patch') return i >= c - Math.floor(w / 2) && i < c - Math.floor(w / 2) + w ? 1 : e0;
            return i >= c ? 1 : e0;
          });
          const K = Kmat(kk.value, lam.value), r = solve(e, K, rec), r0 = solve(Array(N).fill(e0), K, rec);
          for (let i = 0; i < N; i++) {
            inp.rect(i + 0.08, 0, i + 0.92, e[i], { fill: 'gold', fillAlpha: 0.55, stroke: false });
            out.rect(i + 0.08, 0, i + 0.92, Math.max(r[i], -0.2), { fill: r[i] >= 0 ? 'accent' : 'red', fillAlpha: 0.75, stroke: false });
            out.line(i + 0.04, e[i], i + 0.96, e[i], { color: 'muted', width: 1.4, dash: [3, 3] });
          }
          out.hline(0, { color: 'faint' });
          // numbers
          let pk = -1, dp = 1e9; for (let i = 0; i < N; i++) { if (pat.value === 'edge') { if (i >= c) pk = Math.max(pk, r[i]); else dp = Math.min(dp, r[i]); } }
          info = { r, r0, c, e, pk, dp };
        });
        v.readout(() => {
          if (!info) return '';
          const { r, r0, c, e } = info;
          if (pat.value === 'edge') {
            const hi = r[Math.min(N - 1, Math.round((c + N) / 2))], lo = r[Math.max(0, Math.round(c / 2))], pkv = info.pk, dpv = info.dp;
            return `Away from the edge (the ends of a short row are less inhibited) the lit side settles at ${v.fix(hi, 3)} and the dark side at ${v.fix(lo, 3)} (uninhibited 1 and ${e0}); at the edge the bright side peaks at **${v.fix(pkv, 3)}** (+${v.fix(100 * (pkv - hi) / Math.max(hi, 1e-9), 0)}%) and the dark side dips to **${v.fix(dpv, 3)}** (${v.fix(100 * (dpv - lo) / Math.max(lo, 1e-9), 0)}%).`;
          }
          const cc = Math.min(N - 1, Math.max(0, c));
          const nb = Math.min(N - 1, cc + (pat.value === 'patch' ? Math.ceil(wd.value / 2) + 1 : 2));
          return `Lit unit ${cc + 1}: responds **${v.fix(r[cc], 3)}** (it would give 1 with no inhibition) · the unlit unit ${nb + 1} beside the light is pushed from ${v.fix(r0[nb], 3)} (when the whole row is at the background level) down to **${v.fix(r[nb], 3)}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num:'4.8',kind:'Model',name:'Centre–surround filtering and Mach bands',
      statement:String.raw`Mach bands are perceived dark and bright bands near the foot and knee of some luminance ramps. A single centre–surround filter can produce a dip and bump near those transitions, but its signed response is **not perceived brightness**. As Kingdom's 2014 analysis emphasizes, a balanced filter gives equal far-field levels on both sides, and a single filter gives strong edge lobes at a step where distinct Mach bands are absent. These are limitations of the simple account.

Here an explicitly authored ramp is convolved on the **whole real line** with $G_{\sigma_c}-kG_{\sigma_s}$, using unit-integral **one-dimensional** Gaussians. Its exact asymptotic responses are $(1-k)L_0$ and $(1-k)L_1$. For $k=1$ these limits are zero; finite plateaus still receive Gaussian-tail contributions. For $k=0$ the Gaussian-smoothed input is monotone and stays between its two luminance levels.`,
      idea:String.raw`For an input constant in the perpendicular direction, integrating the two-dimensional Gaussian of 4.6 over that direction gives this one-dimensional kernel. Let $a<b$ be the two knees, $\Delta L=L_1-L_0$, and let $\Phi,\phi$ denote the standard normal cumulative distribution and density. The Gaussian mean of a positive hinge is, with $u=z/\sigma$,
$$J_\sigma(z)=z\Phi(u)+\sigma\phi(u).$$
Write $\Delta J_\sigma=J_\sigma(x-a)-J_\sigma(x-b)$. The smoothed ramp is
$$F_\sigma=L_0+\Delta L\,\frac{\Delta J_\sigma}{b-a},$$
and the signed response is $R=F_{\sigma_c}-kF_{\sigma_s}$. At zero ramp width the input is a step and $F_\sigma=L_0+\Delta L\,\Phi((x-c)/\sigma)$, where $c$ is its position.

For a positive-width balanced ramp, the response at its midpoint is zero. Differentiating gives a **positive derivative at both knees**, so neither knee is an extremum of this filter response. The dip lies before the lower knee and the bump after the upper knee. A small-kernel, slowly varying-input expansion can resemble a second derivative; no such approximation is needed for these exact ramp calculations.`,
      caption:String.raw`Set the authored centre width, surround ratio, weight, ramp position and **width including zero**. Gold knee handles move symmetrically about the selected position; the lower handle cannot pass the centre and the upper cannot pass it in the opposite direction. A separate probe slider inspects the response. The input has fixed relative levels 0.25 and 0.8, and the graph includes the full line segment at a step.

The other plot is the computed **signed filter signal**; its vertical scale uses a whole-line bound for the selected weight and width ratio, so read its ticks when comparing settings. It has dashed asymptotic levels and exact probe/knee values in the readout. The grayscale strip is a schematic of the input's encoded gray values, not a calibrated luminance display or a second simulated percept. Compare a ramp with the step endpoint to see why a single filter's lobes alone do not establish a perceptual explanation.`,
      deps:['psych-4.6','rca-8.13'],see:['psych-4.7','art-6.2'],refs:['Kingdom (2014), Mach bands explained by response normalization, introduction, step-edge results/Figure 5 and discussion'],tags:['Mach bands','centre–surround','convolution'],
      credit:'Frederick A. A. Kingdom (2014), Frontiers in Human Neuroscience 8:843, DOI 10.3389/fnhum.2014.00843; ramp/DoG calculation authored here',
      scope:String.raw`This is a bounded family of static, one-dimensional linear filters, not a fit to human judgments or a reproduction of Kingdom's nine-scale response-normalization model. Gaussian tails extend beyond the displayed window and are included analytically. A very short ramp uses stable Gaussian quadrature to avoid subtracting nearly equal hinge values; source/model comparisons are checked independently. Very small responses are subject to cancellation and derivatives can underflow; tiny displayed signs and relative tail accuracy are not certified. Distance, luminance levels and filter gains are authored relative units. Competing perceptual models and viewing/stimulus conditions matter. No original Mach/Ratliff publication, historical priority or complete physiological mechanism is claimed.`,
      links:{source:'https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2014.00843/full'},verify: false,
      viz(v){
        const fmt=x=>x.toFixed(9),sc=v.slider('centre width',.04,.4,.12,{step:'any',decimals:6,fmt}),ratio=v.slider('surround / centre width',2,8,4,{step:'any',decimals:6,fmt}),k=v.slider('surround weight k',0,1.2,1,{step:'any',decimals:6,fmt}),centre=v.slider('ramp position',3.5,6.5,5,{step:'any',decimals:6,fmt}),width=v.slider('ramp width',0,7,1.2,{step:'any',decimals:6,fmt}),probe=v.slider('response probe',-3,13,5,{step:'any',decimals:6,fmt});
        const A=v.stage({x:[-4,14],y:[-.13,1.12],height:260,minWidth:260,axes:'box',gutter:true,xlabel:'position (model units)',ylabel:'relative input level',xticks:[0,5,10],yticks:[0,.25,.8,1],title:'authored ramp or exact step'}),B=v.stage({x:[-4,14],y:[-.85,.94],height:300,minWidth:260,axes:'box',gutter:true,xlabel:'position (model units)',ylabel:'signed filter response',xticks:[0,5,10],title:'filter signal, not perceived brightness'}),C=v.stage({x:[-3,13],y:[0,1],height:80,minWidth:260,axes:false,title:'schematic encoded input grays'});
        const ha=A.handle(4.4,.25,{r:8,color:'gold',constrain:x=>[v.M.clamp(x,centre.value-3.5,centre.value),.25],onDrag:h=>{if(h.x!==centre.value-width.value/2)width.set(2*(centre.value-h.x));}}),hb=A.handle(5.6,.8,{r:8,color:'gold',constrain:x=>[v.M.clamp(x,centre.value,centre.value+3.5),.8],onDrag:h=>{if(h.x!==centre.value+width.value/2)width.set(2*(h.x-centre.value));}});let info;
        v.legend([['ink','authored input'],['accent','signed filter response'],['muted','far-field limits',{dash:true}],['gold','response probe',{dot:true}]]);
        v.render(()=>{const p=machFilter(sc.value,ratio.value,k.value,centre.value,width.value,probe.value);const pad=.12*(p.responseBounds[1]-p.responseBounds[0])+.02;B.setView([-4,14],[p.responseBounds[0]-pad,p.responseBounds[1]+pad]);A.path(p.stimulus,{color:'ink',width:2.5});ha.set(p.a,.25);hb.set(p.b,.8);B.path(p.response,{color:'accent',width:2.5});B.line(-3,p.lowLimit,13,p.lowLimit,{color:'muted',width:1,dash:[4,4]});B.line(-3,p.highLimit,13,p.highLimit,{color:'muted',width:1,dash:[4,4]});B.dot(p.probe,p.atProbe,{r:6,color:'gold'});C.raster((x)=>{const L=rampInput(x,p.centre,p.width);return[...grey(L),1];},{res:2,key:JSON.stringify([p.centre,p.width])});info=p;});
        v.readout(()=>{if(!info)return'';const p=info,f=x=>x.toExponential(7);return `Width ${p.width.toPrecision(10)}, knees a=${p.a.toPrecision(10)}, b=${p.b.toPrecision(10)}. Exact far-field limits: low ${f(p.lowLimit)}, high ${f(p.highLimit)}. Probe x=${p.probe.toPrecision(10)}: input ${f(p.lumProbe)}, response ${f(p.atProbe)}.\nAt lower/upper knees: responses ${f(p.atA)}, ${f(p.atB)}; derivatives ${f(p.slopeA)}, ${f(p.slopeB)}. ${p.width===0?'Exact step endpoint: filter edge lobes are not a prediction of distinct perceived Mach bands.':p.k===1?(p.kneeUnderflow?'Balanced ramp: knee derivatives are analytically positive but below floating-point range here; the extrema are not at the knees.':'Balanced positive-width ramp: both knee derivatives are positive; the extrema are not at the knees.'):p.k===0?'No surround: the output is a monotone Gaussian blur.':'Unbalanced authored filter: dashed lines are asymptotic limits, not exact finite plateau measurements.'} No perceptual extrema or brightness fit is inferred.`;});
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'The Hermann grid and its wavy-line refutation',
      statement: String.raw`In a grid of black squares separated by white streets, faint dark smudges appear at the street intersections that you are not looking at (they vanish when you fixate one). The standard account (Baumgartner, 1960) is that a ganglion cell with a centre–surround field sitting on an intersection has more of its inhibitory surround lit (four streets) than a cell on a street (two), so it responds less. But when the straight streets are replaced by gently **wavy** or bent ones, the smudges are reported to weaken or disappear, although for modest bending a linear centre–surround model still predicts most of its dip at the crossings. This argues that the receptive-field account is, at best, incomplete, and that straightness of the grid lines matters.`,
      idea: String.raw`The centre–surround model is a linear filter, so the response at any point is a fixed weighted sum of the image near it; computing it for the straight grid does give lower values at the intersections than on the streets. The model's response to a modestly bent grid still contains dips at the (now curved) crossings, shrinking only gradually as the bending grows, but nothing in a filter of the model's kind makes the percept depend on whether the streets are straight, and the percept does. Geier and colleagues therefore proposed that the illusion arises from the straightness of the lines' edges (a property that requires orientation-selective cortical processing), not from retinal centre–surround cells alone. This item is deliberately a *test* of the model against an observation: the model's output is computed here; what you see is your own data.`,
      caption: String.raw`**Left:** the grid; fixate a point in the middle of a block of squares and look for grey smudges at the nearby crossings. Increase the *waviness* and see whether they weaken or vanish. **Right:** the output of a centre–surround model on the same picture (bright = strong response): the intersections show dips. The readout compares the model's response at the crossings with the middle of the streets, for the straight grid and for the grid as drawn. The model is a plain difference of Gaussians, with no orientation selectivity; "what the observers see" comes only from you and from the cited study.`,
      deps: ['psych-4.7'],
      refs: ['Goldstein ch. 3'],
      tags: ['Hermann grid', 'illusion', 'receptive field'],
      credit: 'Ludimar Hermann, 1870; Baumgartner, 1960 (centre–surround account, unconfirmed); Geier, Bernáth, Hudák & Séra, 2008, Perception 37: 651–665 (straightness)',
      scope: String.raw`How strong the illusion is depends on the width of the streets relative to the distance and on the size of the area of central vision viewed; and the question of which mechanism produces it is still debated.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Grid_illusion', geier: 'https://geier.hu/Hermann/index.html' },
      verify: true,
      viz(v) {
        const wst = v.slider('street width', 0.2, 1, 0.5, { step: 0.01 });
        const amp = v.slider('waviness (amplitude)', 0, 0.5, 0, { step: 0.01 });
        const sc = v.slider('model centre width $\\sigma_c$', 0.05, 0.4, 0.1, { step: 0.005 });
        const n = 120, P = 2.5, u = 10 / n, LAM = 1.7;
        const left = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 330, weight: 1, minWidth: 290, title: 'the grid' });
        const right = v.stage({ x: [0, 10], y: [0, 10], equal: true, axes: false, height: 330, weight: 1, minWidth: 290, title: 'model response (difference of Gaussians)' });
        const make = (w, A) => {
          const a = new Float64Array(n * n);
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
            const x = (i + 0.5) * u, y = (j + 0.5) * u;
            const dx = ((((x - A * Math.sin((2 * Math.PI * y) / LAM)) % P) + P) % P) - P / 2, dy = ((((y - A * Math.sin((2 * Math.PI * x) / LAM)) % P) + P) % P) - P / 2;
            a[j * n + i] = Math.abs(dx) < w / 2 || Math.abs(dy) < w / 2 ? 1 : 0.04;
          }
          return a;
        };
        const respOf = (I, s) => { const c = blur2(I, n, n, s / u), b = blur2(I, n, n, (4 * s) / u); return Float64Array.from(c, (x, i) => x - b[i]); };
        const at = (R, x, y) => R[Math.min(n - 1, Math.max(0, Math.floor(y / u))) * n + Math.min(n - 1, Math.max(0, Math.floor(x / u)))];
        function dip(R, A) {
          let di = 0, ds = 0, c = 0;
          for (let k = 0; k < 4; k++) for (let m = 0; m < 4; m++) {
            let x = k * P + P / 2 + P, y = m * P + P / 2 + P; // intersection (streets are centred at P/2 + kP)
            x = k * P + P / 2; y = m * P + P / 2;
            for (let t = 0; t < 25; t++) { x = k * P + P / 2 + A * Math.sin((2 * Math.PI * y) / LAM); y = m * P + P / 2 + A * Math.sin((2 * Math.PI * x) / LAM); }
            if (x < 1.2 || x > 8.8 || y < 1.2 || y > 8.8) continue;
            const yy = y + P / 2, xx = k * P + P / 2 + A * Math.sin((2 * Math.PI * yy) / LAM);
            if (yy > 8.8) continue;
            di += at(R, x, y); ds += at(R, xx, yy); c++;
          }
          return c ? { di: di / c, ds: ds / c, dip: 1 - di / ds } : { di: 0, ds: 1, dip: 0 };
        }
        let info = null;
        v.render(() => {
          const w = wst.value, A = amp.value, s = sc.value;
          const I = make(w, A), R = respOf(I, s);
          const key = `${w}|${A}|${s}`;
          left.raster((x, y) => { const g = I[Math.max(0, Math.min(n - 1, Math.floor(y / u))) * n + Math.max(0, Math.min(n - 1, Math.floor(x / u)))]; return [...grey(g), 1]; }, { res: 2, key: 'L' + key });
          let lo = 1e9, hi = -1e9; for (let i = 0; i < R.length; i++) { lo = Math.min(lo, R[i]); hi = Math.max(hi, R[i]); }
          right.raster((x, y) => { const r = at(R, x, y); const t = (r - lo) / Math.max(1e-6, hi - lo); return [...grey(0.1 + 0.85 * t), 1]; }, { res: 2, key: 'R' + key });
          left.dot(5, 5, { r: 4, color: 'red' });
          const d1 = dip(R, A), d0 = A === 0 ? d1 : dip(respOf(make(w, 0), s), 0);
          info = { d1, d0 };
        });
        v.readout(() => info ? `Model response at the crossings relative to mid-street: ${v.fix(100 * (1 - info.d0.dip), 0)}% for the straight grid (a dip of ${v.fix(100 * info.d0.dip, 0)}%) and ${v.fix(100 * (1 - info.d1.dip), 0)}% for the grid as drawn (dip ${v.fix(100 * info.d1.dip, 0)}%). The reported percept of smudges is a separate matter: look at the left panel with waviness 0, then raise it.` : '');
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'White’s illusion: contrast against lateral inhibition',
      statement: String.raw`Take vertical black and white stripes and replace short stretches of two stripes by grey bars of the **same** luminance, one lying in a black stripe and one in a white stripe. The bar in the **black** stripe looks **lighter** than the one in the white stripe. This is the *reverse* of what centre–surround inhibition predicts for the pattern as drawn: a bar in a black stripe has white stripes along its long sides, so a cell centred on it receives a lot of inhibitory light and should signal *darker*. By contrast, grey squares on a plain black and white background (simultaneous contrast) look as the model predicts, with the square on black lighter. So a purely local contrast account cannot be the whole story of lightness.`,
      idea: String.raw`Lateral inhibition (4.7) turns the image into a map of local contrasts; here the map contradicts the percept. Proposed repairs include multiscale filters whose coarse channels show contrast and fine channels assimilation (Blakeslee & McCourt's oriented difference-of-Gaussians model, 1999), and accounts in terms of grouping (the bar belongs with the stripe it lies in) or of framework anchoring (4.12). The effect depends on how much of each bar's border touches the contrasting stripes.`,
      caption: String.raw`**Left:** White's pattern (or the plain simultaneous-contrast *control*), with a **probe** square beside each grey bar. Both bars have the grey level set by *bar luminance*. Adjust the two **match** sliders until each probe looks the same grey as the bar beside it: the difference between your two settings is the size of the illusion for you (nulling it). **Right:** the output of a difference-of-Gaussians model with the scale you choose; the readout says which bar the model calls lighter. The model is plain centre–surround, one scale; real outcomes differ by observer and viewing conditions, and no data from experiments are shown.`,
      deps: ['psych-4.7', 'art-6.3'],
      refs: ['Goldstein ch. 9'],
      tags: ['White illusion', 'lightness', 'illusion'],
      credit: 'Michael White, 1979, Perception 8: 413–416; multiscale account: Blakeslee & McCourt, 1999, Vision Res. 39: 4361–4377 (volume and pages unconfirmed)',
      scope: String.raw`The size and even the direction of the effect change with the stripe width, bar length and viewing distance; the model comparison assumes the bars' long sides are longer than the receptive-field surround.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/White%27s_illusion' },
      verify: true,
      viz(v) {
        const pat = v.select('Pattern', [{ value: 'white', label: 'White’s stripes' }, { value: 'ctrl', label: 'control: plain background' }], 'white');
        const tg = v.slider('bar luminance', 0.25, 0.75, 0.5, { step: 0.01 });
        const sc = v.slider('model scale $\\sigma_c$', 0.05, 0.4, 0.12, { step: 0.005 });
        const mA = v.slider('your match for the upper bar (in the white stripe)', 0, 1, 0.5, { step: 0.005 });
        const mB = v.slider('your match for the lower bar (in the black stripe)', 0, 1, 0.5, { step: 0.005 });
        const nx = 200, ny = 120, u = 0.05;
        const A = [3, 0.9, 4, 2.9], B = [6, 3.1, 7, 5.1], AC = [3, 1.4, 4, 2.4], BC = [6, 3.6, 7, 4.6];
        const img = v.stage({ x: [0, 13.4], y: [0, 6], equal: true, axes: false, height: 330, weight: 1.35, minWidth: 340, title: 'stimulus and probes' });
        const mod = v.stage({ x: [0, 10], y: [0, 6], equal: true, axes: false, height: 250, weight: 1, minWidth: 280, title: 'model response' });
        const build = (p, T) => {
          const a = new Float64Array(nx * ny);
          const bar = p === 'white' ? [A, B] : [AC, BC];
          for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
            const x = (i + 0.5) * u, y = (j + 0.5) * u; let g;
            if (p === 'white') g = Math.floor(x) % 2 === 0 ? 0.04 : 1; else g = x < 5 ? 1 : 0.04;
            for (const r of bar) if (x >= r[0] && x < r[2] && y >= r[1] && y < r[3]) g = T;
            a[j * nx + i] = g;
          }
          return a;
        };
        let info = null;
        v.legend([['ink', 'stimulus'], ['gold', 'probe (your match)']]);
        v.render(() => {
          const p = pat.value, T = tg.value, I = build(p, T), s = sc.value / u;
          const c = blur2(I, nx, ny, s), b = blur2(I, nx, ny, 4 * s), R = Float64Array.from(c, (x, i) => x - b[i]);
          const key = `${p}|${T}|${sc.value}`;
          img.raster((x, y) => { if (x > 10) return [...grey(0.5), 1]; return [...grey(I[Math.max(0, Math.min(ny - 1, Math.floor(y / u))) * nx + Math.max(0, Math.min(nx - 1, Math.floor(x / u)))]), 1]; }, { res: 2, key: 'I' + key });
          const rA = p === 'white' ? A : AC, rB = p === 'white' ? B : BC;
          const sw = (r, m, lab) => { img.rect(10.7, r[1] + 0.3, 12.7, r[3] - 0.3, { fill: grey(m), fillAlpha: 1, color: 'gold', width: 1.6 }); };
          sw(rA, mA.value, 'A'); sw(rB, mB.value, 'B');
          img.text('A', (rA[0] + rA[2]) / 2 + 0.0, rA[3] + 0.3, { align: 'center', size: 12, color: 'gold', weight: 700 });
          img.text('B', (rB[0] + rB[2]) / 2, rB[3] + 0.3, { align: 'center', size: 12, color: 'gold', weight: 700 });
          const samp = (r) => { const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2; let a = 0, k = 0; for (let dy = -0.3; dy <= 0.3; dy += 0.05) for (let dx = -0.3; dx <= 0.3; dx += 0.05) { const i = Math.floor((cx + dx) / u), j = Math.floor((cy + dy) / u); a += R[j * nx + i]; k++; } return a / k; };
          const ra = samp(rA), rb = samp(rB);
          let lo = 1e9, hi = -1e9; for (let i = 0; i < R.length; i++) { lo = Math.min(lo, R[i]); hi = Math.max(hi, R[i]); }
          mod.raster((x, y) => { const t = (R[Math.max(0, Math.min(ny - 1, Math.floor(y / u))) * nx + Math.max(0, Math.min(nx - 1, Math.floor(x / u)))] - lo) / Math.max(1e-6, hi - lo); return [...grey(0.05 + 0.9 * t), 1]; }, { res: 2, key: 'M' + key });
          for (const [r, l] of [[rA, 'A'], [rB, 'B']]) { mod.rect(r[0], r[1], r[2], r[3], { color: 'gold', width: 1.4, stroke: true, fillAlpha: 0 }); mod.text(l, (r[0] + r[2]) / 2, r[3] + 0.3, { align: 'center', color: 'gold', size: 12, weight: 700 }); }
          info = { ra, rb, p };
        });
        v.readout(() => {
          if (!info) return '';
          const model = info.ra > info.rb ? 'A (upper bar)' : 'B (lower bar)';
          const seen = info.p === 'white' ? 'B (the bar in the black stripe)' : 'B (the square on black)';
          return `Model output at the bar centres: A ${v.fix(info.ra, 3)}, B ${v.fix(info.rb, 3)} → the model calls **${model}** lighter · what most viewers report: **${seen}** lighter · your two matches differ by ${v.fix(mB.value - mA.value, 3)} (positive = B matched lighter than A)`;
        });
      },
    },
  ],
};
