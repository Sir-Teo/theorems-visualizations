import { wellRecipe, wellModel, wellAudio, wellRebalance, wellValid, WELL_RECIPES, WELL_CHAIN } from './source-audit-well.js';
// Music Theory & Acoustics — Chapter 7: Tuning and temperament (part b: items 7.7–7.12)
import { continuedModel, CF_ALPHA } from './source-audit-continued.js';
import { equalModel, equalAudio, WE_REFERENCES } from './source-audit-wolf-equal.js';
import { SR, C4, FIFTH, PCOMMA, SCOMMA, M3J, NOTE, sc, fold, circ, ring, cents, seqCents, chordCents, nearPairs, tuneFromFifths, CHAIN, chainSemi, ivl, triadC, triadAbs, cfExpand, convs, edoApprox } from './ch07.shared.js';
import { meantoneModel, meantoneAudio, JM_ET_ALPHA } from './source-audit-just-meantone.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export default {
  collection: 'music',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.7
    {
      num:'7.7',kind:'Method',name:'Quarter-comma meantone',
      statement:String.raw`Let $C_s=1200\log_2(81/80)$ be the syntonic comma in cents. A regular meantone fifth with narrowing fraction $\alpha$ has ratio
$$q=(3/2)(81/80)^{-\alpha}.$$
Its size is $f=1200\log_2q$. Four regular fifths minus two octaves give a major third of $4f-2400$ cents. At $\alpha=1/4$, $q^4=5$, so that third is exactly $5/4$; $f\approx696.578428$ cents. At $\alpha=1/3$, $q^3=10/3$, so the regular minor third $4/q^3$ is exactly $6/5$.

In the specified twelve-note cut, eleven fifths have ratio $q$ and the closing fifth has ratio $W=2^7/q^{11}$. At quarter comma, $W/q=128/125$: eight major thirds are pure and the four crossing the cut are higher by about 41.058858 cents.

Twelve equal fifths require $f=700$, hence
$$\alpha_{\rm ET}=\frac{1200\log_2(3/2)-700}{C_s}$$
which is approximately 0.090903680. It is close to $1/11$, but is not equal to it.`,
      idea:String.raw`The syntonic comma identity (7.6) gives $(3/2)^4/(5/4)=4(81/80)$. Removing a quarter comma from each of four fifths therefore makes the major third pure. The twelve fifths must multiply to $2^7$; eleven chosen generators determine the closing fifth, rather than forcing all twelve generators to be equal.

Our chain is E♭–B♭–F–C–G–D–A–E–B–F♯–C♯–G♯, with C anchored at ratio 1. The closing step G♯–E♭ is the cut. A major third traverses four steps: eight do not cross the cut and four do. Their difference is $1200\log_2(W/q)$. In quarter comma $q^{12}=125$, proving the diesis ratio $128/125$. In equal temperament $q^{12}=128$, so $W=q$ and the difference vanishes.`,
      caption:String.raw`The continuous $\alpha$ control covers 0–0.34. Presets use exact Pythagorean, quarter-comma, third-comma and equal-tempered definitions; the separate $1/11$ preset demonstrates its small difference from equal temperament. Left: deviations of the regular fifth, regular major/minor thirds and closing fifth from their pure ratios. Right: every major third in the specified twelve-note cut; gold selects the triad played. The plots include the entire offered range.`,
      deps:['music-7.6','music-7.5'],see:['music-7.4','music-7.12','music-7.8','music-7.9'],
      refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §5.12, pp.176–179 and exercise1'],tags:['meantone','temperament'],
      credit:'Tuning exposition: Dave Benson, 2008 Web version; twelve-note cut, continuous controls and synthesis authored here.',
      scope:String.raw`A specified mathematical twelve-note model, not a historical priority, keyboard prescription or judgement that a third is unusable. Other cuts and extra enharmonic keys are possible. Preset identities are exact symbolic definitions; general control values and displayed cents are evaluated numerically. At $1/11$, the regular fifth is approximately 699.999884 cents and the closing fifth 700.001280 cents. Audio uses the same authored C4 = 261.6256-Hz, six-harmonic, 44,100-Hz convention as 7.5, with peak bound 0.12 and 10-ms end ramps. The output is uncalibrated and does not certify a perceptual difference.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify: false,
      viz(v){
        const alpha=v.slider('syntonic-comma fraction α',0,.34,.25,{step:'any',fmt:x=>x.toPrecision(12)}),key=v.slider('triad root',0,11,0,{int:true,fmt:x=>meantoneModel(.25,x).keyName});
        [['Pythagorean',0],['1/4',.25],['1/3',1/3],['Exact 12-TET',JM_ET_ALPHA],['1/11 comparison',1/11]].forEach(([label,x])=>v.button(label,()=>alpha.set(x)));
        const A=v.stage({x:[-.7,3.7],y:[-40,75],axes:'box',gutter:true,height:340,minWidth:280,xticks:[[0,'5th'],[1,'M3'],[2,'m3'],[3,'close 5th']],ylabel:'error from pure (cents)',title:'regular intervals and closing fifth'});
        const B=v.stage({x:[-35,85],y:[-1.1,12.2],axes:false,full:true,height:430,minWidth:280,title:'all twelve major-third errors (cents)'});
        let info;const play=action=>sd=>{const a=meantoneAudio(alpha.value,key.value,action);sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});};
        v.soundButton('Play selected triad',play('triad'));v.soundButton('Play closing fifth',play('closing'));v.soundButton('Regular fifth, then pure',play('compare'));v.button('Stop audio',()=>v.sound().stop());
        v.render(()=>{
          const a=meantoneModel(alpha.value,key.value);info=a;const lo=Math.min(0,...a.errors)-15,hi=Math.max(0,...a.errors)+15;A.setView([-.7,3.7],[lo,hi]);A.line(-.45,0,3.45,0,{color:'muted',width:1});
          a.errors.forEach((e,j)=>{const col=['accent','orange','purple','red'][j];A.rect(j-.3,0,j+.3,e,{fill:col,fillAlpha:.55,stroke:false});A.text(`${e<0?'−':'+'}${v.fix(Math.abs(e),3)}`,j,e,{size:10.5,align:'center',baseline:e>=0?'bottom':'top',dy:e>=0?-4:4,color:col});});
          B.text('note',-32,11.7,{size:11,weight:700,align:'left',baseline:'middle'});B.text('third error (¢)',28,11.7,{size:11,weight:700,align:'center',baseline:'middle'});B.line(0,-.3,0,11.3,{color:'muted',width:1});
          a.thirds.forEach((t,j)=>{const y=11-j,col=t.pure?'green':t.error<0?'purple':'orange';B.text(t.name,-32,y,{size:12,align:'left',baseline:'middle'});if(j===key.value)B.dot(-18,y,{r:4.5,ring:false,color:'gold'});B.rect(0,y-.22,t.error,y+.22,{fill:col,fillAlpha:.65,stroke:false});B.text(`${t.error<0?'−':'+'}${v.fix(Math.abs(t.error),3)}`,80,y,{size:10.5,align:'right',baseline:'middle',color:col});});
        });
        v.legend([['green','exact pure third at quarter-comma preset'],['purple','below the pure third'],['orange','above the pure third'],['gold','selected root']]);
        v.readout(()=>{const a=info;return `α=${a.alpha.toPrecision(12)}; ${a.kind==='equal'?'exact 12-TET preset: all twelve fifths are 700 cents':a.kind==='quarter'?'quarter-comma preset: eight exact pure major thirds':a.kind==='third'?'third-comma preset: regular minor third is exactly 6/5':a.kind==='pythagorean'?'Pythagorean generator':'general numerical parameter'}. Regular fifth ${v.fix(a.fifth,9)} cents; closing fifth ${v.fix(a.closing,9)} cents. Regular major / minor third ${v.fix(a.major,9)} / ${v.fix(a.minor,9)} cents. Cut difference ${v.fix(a.delta,9)} cents. Selected ${a.keyName} triad: ${a.triad.map(x=>v.fix(x,6)).join(', ')} Hz; intervals ${a.triadCents.map(x=>v.fix(x,6)).join(', ')} cents. At 1/11 the fifths are close to equal, and are not all 700 cents.`;});
      },
    },
    // ------------------------------------------------------------------ 7.8
    {
      num:'7.8',kind:'Method',name:'Well temperaments',
      statement:String.raw`Write $P=1200\log_2(531441/524288)$ for the Pythagorean comma and $S=1200\log_2(81/80)$ for the syntonic comma. If fifth $i$ is $d_i$ cents narrower than $3/2$, a twelve-fifth chain closes after seven octaves exactly when
$$\sum_{i=0}^{11}d_i=P.$$
A negative $d_i$ means a widened fifth. A major third reached through four successive fifths has signed error from $5/4$ equal to
$$S-(d_i+d_{i+1}+d_{i+2}+d_{i+3}),$$
with cyclic indices. Closure alone places no bound on individual fifths and does not guarantee musical usability.

Benson's exposition of irregular or well temperaments gives the named recipes compared here: Werckmeister III distributes $P/4$ over C–G, G–D, D–A and B–F♯; Kirnberger III uses $S/4$ over C–G–D–A–E and $P-S$ on F♯–C♯; the displayed Vallotti recipe uses $P/6$ over F–C–G–D–A–E–B. All other fifths in each recipe are pure.`,
      idea:String.raw`Twelve pure fifths total $8400+P$ cents. Subtracting narrowings with sum $P$ leaves 8400. Four pure fifths minus two octaves give the Pythagorean third $81/64$, which exceeds $5/4$ by $S$; subtracting the four relevant narrowings gives the stated signed error. The table checks this formula for every starting note, including windows crossing the closing edge.

The named recipes are Benson's transcriptions, rather than newly authenticated readings of historical manuscripts. The equal recipe shares $P$ uniformly. The Pythagorean and quarter-comma cuts are contrasting closed examples with a concentrated closing discrepancy. Their inclusion shows why the sum constraint alone is weaker than a claim that every key works equally well.`,
      caption:String.raw`Drag any gold handle to change one fifth's narrowing. The other eleven receive a common shift, clipped to the declared −40…25-cent bounds, until their total closes the chain. Load a recipe to reset all handles. The complete table gives every fifth and its major-third error. Choose C or F♯ and play the declared upward I–IV–V–I triads; the actual frequencies are printed below.`,
      deps:['music-7.3','music-7.6','music-7.7'],see:['music-7.9','music-7.14'],
      refs:['Benson, Music: A Mathematical Offering, Web version14Dec2008, §5.13, pp.181–187; named recipes are his technical transcriptions'],tags:['temperament','keys'],
      credit:'Named recipes as transcribed by Dave Benson; bounded redistribution, comparisons and synthesis authored here.',
      scope:String.raw`A finite mathematical comparison of explicitly specified recipes, with no claim about historical dates, priority, a composer's preferred tuning or universal key character. The drag bounds are authored constraints, not a definition of well temperament. Exact logarithmic formulas specify closure; binary64 evaluation leaves the displayed residual, which is reported rather than asserted to be zero. The C4 anchor is 261.6256 Hz; each cadence root lies in its C4–C5 octave and the other voices ascend from it. Audio is the same authored 44,100-Hz H8 signal as 7.4/7.9, with amplitudes 1/h, pre-output bound 0.12, 10-ms ramps and zero-sample gaps. Output gain/limiter and device are separate; frequency errors do not measure perceived quality.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify:false,
      viz(v){
        let d=wellRecipe('werckmeister');
        const pre=v.select('recipe',[...Object.entries(WELL_RECIPES).map(([value,label])=>({value,label})),{value:'custom',label:'custom'}],'werckmeister',{onChange:k=>{if(k!=='custom'){d=wellRecipe(k);hs.forEach((h,j)=>h.set(j,d[j]));}}});
        const key=v.select('cadence in',[{value:0,label:'C'},{value:6,label:'F♯'}],0);
        const A=v.stage({x:[-.8,11.8],y:[-47,32],axes:'box',gutter:true,full:true,height:350,minWidth:240,xlabel:'fifth starting on …',ylabel:'narrower than 3/2 (cents)',xticks:WELL_CHAIN.map((x,j)=>[j,x]),yticks:[-40,-20,0,20],title:'drag a gold handle; all twelve remain bounded'});
        const B=v.stage({x:[0,1],y:[-.5,12.7],axes:false,full:true,height:440,minWidth:240,title:'all twelve fifths and major-third signed errors (cents)'});
        const hs=d.map((x,j)=>{const h=A.handle(j,x,{color:'gold',r:6,constrain:(_x,y)=>[j,Math.max(-40,Math.min(25,y))]});h.onDrag=()=>{d=wellRebalance(d,j,h.y);pre.value='custom';hs.forEach((g,i)=>g.set(i,d[i]));};return h;});
        v.shareState('closing fifth narrowings',{get:()=>({d:[...d],recipe:pre.value}),validate:s=>!!s&&wellValid(s.d)&&(s.recipe==='custom'||Object.hasOwn(WELL_RECIPES,s.recipe)&&wellRecipe(s.recipe).every((x,j)=>Math.abs(x-s.d[j])<1e-9)),set:s=>{d=[...s.d];pre.value=s.recipe;hs.forEach((h,j)=>h.set(j,d[j]));}});
        let info;v.soundButton('Play declared I–IV–V–I',sd=>{const a=wellAudio(d,key.value);sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});});v.button('Stop audio',()=>v.sound().stop());
        v.render(()=>{
          const a=wellModel(d,key.value);info=a;hs.forEach((h,j)=>h.set(j,d[j]));A.line(-.4,0,11.4,0,{color:'muted',width:1});
          a.rows.forEach(r=>A.rect(r.j-.28,0,r.j+.28,r.narrowing,{fill:r.narrowing<0?'purple':'orange',fillAlpha:.5,stroke:false}));
          [['note',.07],['narrow',.35],['fifth',.65],['M3 error',.95]].forEach(([t,x])=>B.text(t,x,12.05,{size:10.5,align:x===.95?'right':'center',baseline:'middle',weight:700}));
          a.rows.forEach((r,j)=>{const y=11-j,col=r.error<0?'purple':'orange';B.text(r.name,.07,y,{size:11.5,align:'center',baseline:'middle'});B.text(v.fix(r.narrowing,3),.35,y,{size:10.5,align:'center',baseline:'middle'});B.text(v.fix(r.fifth,3),.65,y,{size:10.5,align:'center',baseline:'middle'});B.text(`${r.error<0?'−':'+'}${v.fix(Math.abs(r.error),3)}`,.95,y,{size:10.5,align:'right',baseline:'middle',color:col});});
        });
        v.legend([['gold','draggable fifth'],['orange','positive narrowing / third error'],['purple','negative narrowing / third error']]);
        v.readout(()=>{const a=info;return `Closure residual (binary64): ${a.closureResidual.toExponential(2)} cents; narrowing-sum residual ${a.narrowingResidual.toExponential(2)} cents. Fifth range ${v.fix(a.minFifth,6)}–${v.fix(a.maxFifth,6)} cents. Actual C4-anchored cadence events (Hz): ${a.cadence.map(fs=>fs.map(f=>v.fix(f,4)).join(', ')).join(' → ')}. The signed third error is S minus four narrowings; it is not a quality score.`;});
      },
    },
    // ------------------------------------------------------------------ 7.9
    {
      num:'7.9',kind:'Invention',name:'Twelve-tone equal temperament',
      statement:String.raw`Twelve-tone equal temperament (12-TET) divides an octave into twelve equal frequency ratios. An interval of $n$ semitones has ratio $2^{n/12}$ and size $100n$ cents (1.6). Multiplying every frequency by one positive factor preserves these interval ratios; this statement does not assert identical timbre or perceived quality in every key.

The fifth has ratio $2^{7/12}$, approximately 1.498307077. Each of twelve equal fifths is narrower than $3/2$ by exactly one twelfth of the Pythagorean comma in cents. This equals approximately 1.955001 cents. It is close to one eleventh of the syntonic comma, but is not exactly that fraction.`,
      idea:String.raw`Twelve semitone steps multiply to 2. Twelve seven-semitone fifths therefore multiply to $2^7$, closing after seven octaves. Their cents deficit from twelve pure fifths is precisely the comma (7.3). A non-octave interval $2^{n/12}$ with $0<n<12$ is irrational: if a reduced rational $p/q$ had twelfth power $2^n$, unique factorization would force $q=1$ and $12$ to divide $n$.

For the ideal fixed string of 2.4, $f_1=(2L)^{-1}\sqrt{T/\mu}$. Holding tension $T$ and mass per length $\mu$ fixed, the remaining vibrating length at semitone $n$ is $L2^{-n/12}$. Distance from the nut is instead $L(1-2^{-n/12})$.

The major triad uses the pure ratios $4{:}5{:}6$ (7.5); the minor comparison uses $10{:}12{:}15$. The harmonic-seventh comparison is $4{:}5{:}6{:}7$, including $7/4$. Benson distinguishes it from a related dominant-seventh construction using $16/9$. For the declared harmonic synthesis (6.2), partials coincide exactly when $h f_i=k f_j$. Integer arithmetic identifies these pairs in the rational chords; the readout then evaluates the corresponding 12-TET frequency separations numerically.`,
      caption:String.raw`The reference control changes the fret comparison and highlighted table row. Its rational intervals are declared comparison choices, not a unique chromatic just scale; $9/5$ and $7/4$ are separate seventh references. The top diagram includes all thirteen positions $n=0,\ldots,12$, from nut to octave. Blue and green mark the selected equal and rational nut distances. The table gives every reference’s cents and signed 12-TET error. The separate chord control changes playback; it does not follow the fret-reference selection.`,
      deps:['music-7.3','music-1.6','music-2.4','music-7.5','music-6.2'],see:['music-7.11','music-7.7'],
      refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §5.14, pp.190–192; §§5.5 and 5.7; ideal-string formula §3.2, pp.89–91'],tags:['equal temperament'],
      credit:'Mathematical tuning exposition: Dave Benson, 2008 Web version; reference collection, ideal-string diagram and synthesis authored here.',
      scope:String.raw`An ideal ratio and string model, without a claim about historical priority, a rule-of-eighteen recipe, a real instrument’s fret compensation or measured consonance. The 650-mm scale is an authored distance example. Audio uses C4 = 261.6256 Hz, mono 44,100-Hz synthesis and exactly eight harmonics per voice with amplitudes $1/h$, averaged across voices and divided by $\sum_{h=1}^8 1/h$. The pre-output peak is bounded by 0.12, with 10-ms end ramps; every played harmonic is below Nyquist. The runtime master gain/limiter and device affect output. Exact rational coincidences and numerical frequency differences do not certify perceived beats or roughness.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify:false,
      viz(v){
        const reference=v.select('fret reference',WE_REFERENCES.map(r=>({value:r.id,label:r.name})), 'M3');
        const chord=v.select('played chord',[{value:'major',label:'major triad 4:5:6'},{value:'minor',label:'minor triad 10:12:15'},{value:'harmonic7',label:'harmonic seventh 4:5:6:7'}],'major');
        const A=v.stage({x:[-.03,.54],y:[-.05,1.1],axes:false,full:true,height:245,minWidth:240,title:'ideal string: distance from nut / original length'});
        const B=v.stage({x:[-.15,4.9],y:[-.7,12.5],axes:false,full:true,height:440,minWidth:240,title:'declared rational references and 12-TET errors'});
        let info;const play=action=>sd=>{const a=equalAudio(reference.value,chord.value,action);sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});};
        v.soundButton('Play rational chord',play('just'));v.soundButton('Play equal-tempered chord',play('equal'));v.soundButton('Alternate rational / equal',play('alternate'));v.button('Stop audio',()=>v.sound().stop());
        v.render(()=>{
          const a=equalModel(reference.value,chord.value);info=a;const r=a.row;
          A.text(`rational ${r.exact}: x/L=${v.fix(r.justPosition,6)}`,.005,.94,{size:11,align:'left',baseline:'middle',color:'green',weight:600});A.text(`12-TET n=${r.n}: x/L=${v.fix(r.etPosition,6)}`,.005,.78,{size:11,align:'left',baseline:'middle',color:'accent',weight:600});
          A.line(0,.2,.5,.2,{color:'muted',width:2});a.frets.forEach(f=>A.line(f.position,.14,f.position,.34,{color:f.n===r.n?'accent':'faint',width:f.n===r.n?2.4:1.2}));A.line(r.etPosition,.2,r.etPosition,.59,{color:'accent',width:2.4});A.dot(r.etPosition,.59,{r:5,ring:false,color:'accent'});A.line(r.justPosition,.2,r.justPosition,.43,{color:'green',width:2.4});A.dot(r.justPosition,.43,{r:5,ring:false,color:'green'});A.text('nut: n=0',0,.045,{size:10,align:'left',baseline:'middle',color:'muted'});A.text('octave: n=12',.5,.045,{size:10,align:'right',baseline:'middle',color:'muted'});
          ['ref','ratio','ref (¢)','ET−ref (¢)'].forEach((t,i)=>B.text(t,[.28,1.5,2.9,4.2][i],11.9,{size:10.5,align:'center',baseline:'middle',weight:700}));
          a.rows.forEach((r,j)=>{const y=11-j,col=r.id===a.reference?'gold':r.error<0?'accent':'orange';B.text(r.id,.28,y,{size:11,align:'center',baseline:'middle',color:col,weight:r.id===a.reference?700:400});B.text(r.exact,1.5,y,{size:10.5,align:'center',baseline:'middle'});B.text(v.fix(r.cents,3),2.9,y,{size:10.5,align:'center',baseline:'middle'});B.text(`${r.error<0?'−':'+'}${v.fix(Math.abs(r.error),3)}`,4.2,y,{size:10.5,align:'center',baseline:'middle',color:col});});
        });
        v.legend([['accent','equal-tempered nut distance / negative error'],['green','selected rational nut distance'],['gold','selected reference row'],['orange','positive error']]);
        v.readout(()=>{const a=info,r=a.row;return `${r.name}: rational ${r.exact} = ${v.fix(r.cents,6)} cents; 12-TET ${r.etCents} cents; signed error ${r.error<0?'−':'+'}${v.fix(Math.abs(r.error),6)} cents. Nut distances on the authored 650-mm string: rational ${v.fix(650*r.justPosition,6)} mm, equal ${v.fix(650*r.etPosition,6)} mm; separation ${v.fix(r.distanceMm,6)} mm. Actual played rational frequencies ${a.just.map(x=>v.fix(x,6)).join(', ')} Hz; equal ${a.equal.map(x=>v.fix(x,6)).join(', ')} Hz. Exact rational coincidences among played H1–H8: ${a.coincidences.length}. Corresponding numerical equal-tempered separations (voice:partial pairs): ${a.coincidences.map(p=>`${p.i+1}:${p.h}/${p.j+1}:${p.k} = ${v.fix(p.equalSeparation,6)} Hz`).join('; ')}. These are frequency differences, not measured roughness or a perceived-beat certificate.`;});
      },
    },
    // ------------------------------------------------------------------ 7.10
    {
      num:'7.10',kind:'Theorem',name:'Continued fractions give best approximations',
      statement:String.raw`Let $\alpha$ be irrational, with simple continued fraction $[a_0;a_1,a_2,\ldots]$ and convergents $p_k/q_k$. For $k\ge1$, every integer pair $p,q$ with $1\le q<q_{k+1}$ satisfies
$$|q\alpha-p|\ge|q_k\alpha-p_k|.$$
Thus “best” here concerns the error $|q\alpha-p|$, called approximation of the second kind. Convergents alternate around $\alpha$ and obey
$$\left|\alpha-\frac{p_k}{q_k}\right|<\frac{1}{q_kq_{k+1}}.$$
For $\alpha=\log_2(3/2)$, the expansion starts $[0;1,1,2,2,3,1,5,2,23,\ldots]$, giving $0/1,1/1,1/2,3/5,7/12,24/41,31/53,179/306,389/665,\ldots$.`,
      idea:String.raw`The integer-part and reciprocal algorithm defines the partial quotients. Starting with $p_{-2}=0,p_{-1}=1,q_{-2}=1,q_{-1}=0$, use $p_k=a_kp_{k-1}+p_{k-2}$ and the same recurrence for $q_k$. Consecutive vectors $(p_k,q_k),(p_{k+1},q_{k+1})$ have determinant $\pm1$, so every integer pair has integer coordinates $A,B$ in this basis.

Write $\varepsilon_j=q_j\alpha-p_j$. The complete-quotient formula shows that consecutive $\varepsilon_j$ have opposite signs, decrease in magnitude, and $|\varepsilon_k|<1/q_{k+1}$. If $A,B$ are nonzero with opposite signs, then $|A\varepsilon_k+B\varepsilon_{k+1}|\ge|\varepsilon_k|$. If they have the same sign, positive denominator below $q_{k+1}$ is impossible. If either coefficient is zero, the denominator constraint or the error bound again excludes a strictly better pair. This proves the stated minimum. The irrationality needed for the musical example is established in 7.2.`,
      caption:String.raw`Choose convergent index $k=1,\ldots,7$. Every dot uses the nearest integer numerator at a denominator $q=1,\ldots,665$. Green marks the selected convergent; gold marks the next one, which first beats its error. The shaded band is $\pm|q_k\alpha-p_k|$. The complete nine-row table includes the initial $0/1$ and both endpoints used by every offered control state.`,
      deps:['music-7.2','pma-1.20'],see:['music-7.11','music-7.2'],
      refs:['Benson, Music: A Mathematical Offering, Web version14Dec2008, §6.2, pp.204–208, recurrence and convergent bounds','Ben Lynn, Continued Fractions: Convergence, Stanford author notes, Bounds; determinant-basis argument supplied here'],
      tags:['continued fractions','approximation'],
      credit:'Mathematical exposition: Dave Benson and Ben Lynn; finite example and determinant-basis proof written here.',
      scope:String.raw`The theorem is exact for irrational $\alpha$; it is not a historical priority claim or a claim that a good fifth alone optimizes a musical scale. The displayed example uses binary64 logarithms for a bounded set of denominators. Independent rational log-series enclosures certify its listed partial quotients, nearest numerators, error signs and finite minima. Decimal readouts are rounded. Minimizing $|\alpha-p/q|$ is a different criterion and may also select intermediate fractions.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf',bounds:'https://crypto.stanford.edu/pbc/notes/contfrac/converge.html'},verify:false,
      viz(v){
        const K=v.slider('convergent index k',1,7,4,{int:true});
        const A=v.stage({x:[.5,1000],y:[-.56,.56],xlog:true,axes:'box',gutter:true,full:true,height:350,minWidth:240,xlabel:'denominator q',ylabel:'qα − nearest integer',xticks:[1,2,5,12,41,100,306,665],title:'all denominators through 665; selected and next convergents'});
        const B=v.stage({x:[0,1],y:[-.2,10],axes:false,full:true,height:350,minWidth:240,title:'partial quotients and convergents; error is |qα − p|'});
        let info;
        v.render(()=>{
          const a=continuedModel(K.value);info=a;
          A.hband(-a.error,a.error,{color:'green',alpha:.13});A.line(1.1,0,660,0,{color:'muted',width:1});
          A.dots(a.points.map(x=>[x.q,x.signed]),{r:1.5,color:'faint'});
          for(const row of a.rows.slice(1))A.dot(row.q,row.q*CF_ALPHA-row.p,{r:3,ring:false,color:row.q*CF_ALPHA-row.p>0?'orange':'purple'});
          A.dot(a.next.q,a.next.q*CF_ALPHA-a.next.p,{r:6.5,ring:false,color:'gold'});
          A.dot(a.current.q,a.signed,{r:6.5,ring:false,color:'green'});
          [['k',.07],['aₖ',.23],['pₖ/qₖ',.53],['|qα−p|',.92]].forEach(([t,x])=>B.text(t,x,9.45,{size:10.5,align:x===.92?'right':'center',baseline:'middle',weight:700}));
          a.rows.forEach((r,j)=>{const y=8.7-j,col=j===a.k?'green':j===a.k+1?'gold':'ink';B.text(String(j),.07,y,{size:11,align:'center',baseline:'middle',color:col});B.text(String(r.a),.23,y,{size:11,align:'center',baseline:'middle',color:col});B.text(`${r.p}/${r.q}`,.53,y,{size:11,align:'center',baseline:'middle',color:col});B.text(v.fix(r.error,6),.92,y,{size:10.5,align:'right',baseline:'middle',color:col});});
        });
        v.legend([['green','selected convergent / error band'],['gold','next convergent'],['orange','nearest numerator below α'],['purple','nearest numerator above α']]);
        v.readout(()=>{const a=info;return `k=${a.k}: ${a.current.p}/${a.current.q}; |qα−p|=${v.fix(a.error,9)} < 1/${a.next.q}=${v.fix(a.bound,9)}. Exhaustive displayed-domain minimum over 1≤q<${a.next.q}: ${v.fix(a.minimum,9)} at q=${a.minimizer}. Next ${a.next.p}/${a.next.q} has smaller second-kind error. All decimals are rounded evaluations.`;});
      },
    },
    // ------------------------------------------------------------------ 7.11
    {
      num: '7.11',
      kind: 'Theorem',
      name: 'Why twelve: 7/12 is a convergent of log₂(3/2)',
      statement: String.raw`The best fifth in an $n$-note equal division of the octave is $k$ steps with $k=\mathrm{round}(n\log_2\tfrac32)$, of error $\frac{1200}{n}|n\alpha-k|$ cents, $\alpha=\log_2(3/2)$. As $n$ grows, the divisions that set a new record low of this error are, up to 700 notes, $n=5, 7, 12, 29, 41, 53, 200, 253, 306, 359, 665$ (errors 18.0, 16.2, 1.96, 1.49, 0.48, 0.07, 0.045, 0.021, 0.006, 0.005 ¢ and below), each the denominator of a convergent ($\tfrac35,\tfrac7{12},\tfrac{24}{41},\tfrac{31}{53},\tfrac{179}{306},\tfrac{389}{665}$) or of an intermediate fraction between two of them ($\tfrac47,\tfrac{17}{29}$, …); I have checked the list up to 700 by computer, and the identification of the intermediate ones for the small cases. In particular, 7/12 is a convergent (7.10): no division with fewer than 41 notes has a fifth whose step error $|n\alpha-k|$ is smaller than the 12-note fifth's 0.0235 steps, and no division with fewer than 29 notes has a fifth closer in cents.`,
      idea: String.raw`Approximating the fifth by $k/n$ of the octave is rational approximation of $\alpha$; the quality measure in steps, $|n\alpha-k|$, is exactly what 7.10 controls, with $q=n$, $p=k$. Its record-setters are the convergents $\frac12,\frac35,\frac7{12},\frac{24}{41},\frac{31}{53}$; the quality measure in cents divides by $n$, $|\alpha-k/n|$, whose records also include intermediate fractions such as $4/7$ and $17/29$ — hence 7 and 29. The larger the next partial quotient, the longer a convergent stays unbeaten: $7/12$ survives until 41 (next quotient 3, $41=3\cdot12+5$), and $31/53$ until 306 (next quotient 5, $306=5\cdot53+41$).`,
      caption: String.raw`The error of the best fifth in an $n$-note equal division, in cents on a logarithmic axis, for $n$ from 3 to 120; record lows are orange and labelled. Choose the target interval: the fifth (records 5, 7, 12, 29, 41, 53), the major third 5/4 (records 3, 16, 19, 22, 25, 28, …) or the harmonic seventh 7/4. Slide $n$ to read the details of one division and play its fifth against a pure one.`,
      deps: ['music-7.10', 'music-7.9'],
      see: ['music-7.12', 'music-7.13', 'music-7.2'],
      refs: ['Benson ch. 6', 'Sethares ch. 4'],
      tags: ['equal temperament', 'continued fractions'],
      scope: String.raw`Mathematical statement about the octave and the fifth 3/2; whether a good fifth alone makes a good tuning depends on the thirds (7.12, 7.13). The listed records were computed by exhaustive search up to $n=700$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equal_temperament' },
      viz(v) {
        const TG = { fifth: [cents(1.5), '3/2'], third: [M3J, '5/4'], sev: [cents(7 / 4), '7/4'] };
        const which = v.select('target', [{ value: 'fifth', label: 'fifth 3/2' }, { value: 'third', label: 'major third 5/4' }, { value: 'sev', label: 'harmonic seventh 7/4' }], 'fifth');
        const n = v.slider('notes per octave n', 3, 120, 12, { int: true });
        const s = v.stage({ x: [2, 122], y: [0.02, 150], ylog: true, axes: 'box', gutter: true, height: 380, full: true, xlabel: 'notes per octave n', ylabel: 'error of the best step (¢)', xticks: [5, 7, 12, 19, 29, 31, 41, 53, 72, 100].map((x) => [x, String(x)]), title: 'how well n equal steps approximate the target' });
        const snd = v.sound();
        const data = () => { const c = TG[which.value][0], out = []; let best = 1e9; for (let m = 3; m <= 120; m++) { const [k, e] = edoApprox(m, c); const a = Math.abs(e); const rec = a < best - 1e-9; if (rec) best = a; out.push({ n: m, k, e, a, rec }); } return out; };
        v.soundButton('play the n-step fifth', (sd) => { const [k] = edoApprox(n.value, cents(1.5)); sd.samples(chordCents([0, (k * 1200) / n.value], C4, 2.0), SR, { gain: 0.9 }); });
        v.soundButton('pure fifth', (sd) => sd.samples(chordCents([0, FIFTH], C4, 2.0), SR, { gain: 0.9 }));
        v.render(() => {
          const D = data(), f = (x) => Math.max(0.02, x.a);
          s.dots(D.filter((x) => !x.rec).map((x) => [x.n, f(x)]), { r: 2.8, color: 'accent', alpha: 0.6 });
          D.filter((x) => x.rec).forEach((x) => { s.dot(x.n, f(x), { r: 6, color: 'orange' }); s.text(String(x.n), x.n, f(x), { size: 11.5, color: 'orange', align: 'center', baseline: 'bottom', dy: -8, weight: 700, plate: true }); });
          const cur = D[n.value - 3]; s.vline(n.value, { color: 'gold', dash: [5, 4] }); s.dot(n.value, f(cur), { r: 8, color: 'gold', hollow: true });
        });
        v.legend([['accent', 'error of n equal steps'], ['orange', 'new record low'], ['gold', 'your n']]);
        v.readout(() => {
          const D = data(), cur = D[n.value - 3], recs = D.filter((x) => x.rec).map((x) => x.n), [c, nm] = TG[which.value], k = cur.k;
          return `n = ${cur.n}: ${nm} is approximated by ${k} steps = ${v.fix((k * 1200) / cur.n, 2)} ¢ (pure ${v.fix(c, 2)} ¢), error ${sc(v, cur.e, 2)} ¢ · ${cur.rec ? 'a new record for n up to this point' : 'not a record: an earlier division was at least as good'} · records for ${nm} up to 120: ${recs.join(', ')}${which.value === 'fifth' ? ` · in steps, $|n\\alpha-k|=${v.fix(Math.abs(cur.n * Math.log2(1.5) - k), 4)}$` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12',
      kind: 'Concept',
      name: '19- and 31-tone equal temperament',
      statement: String.raw`**19-tone equal temperament** (19-TET, step 63.16 ¢) has a fifth of 694.74 ¢ (7.2 ¢ narrow), a major third of 378.95 ¢ (7.4 ¢ narrow of 5/4) and a minor third of 315.79 ¢ (0.15 ¢ from 6/5): it is very nearly one-third-comma meantone. **31-tone equal temperament** (step 38.71 ¢) has a fifth of 696.77 ¢ (5.2 ¢ narrow), a major third of 387.10 ¢ (0.8 ¢ wide of 5/4) and a harmonic seventh of 967.74 ¢ (1.1 ¢ from 7/4): it is almost exactly quarter-comma meantone (whose fifth is 696.58 ¢, 0.2 ¢ away), and also reproduces 7-limit intervals. Twelve-tone equal temperament, by contrast, mistunes the thirds by 14–16 ¢ and the seventh by 31 ¢. Both 19 and 31 are meantone systems: their chain of fifths generates all their notes, and a closed chain of 19 or 31 fifths replaces the wolf.`,
      idea: String.raw`If the fifth is narrowed by a fraction $\alpha$ of the syntonic comma (7.7), after $n$ fifths the chain closes only when $n(701.955-21.506\alpha)$ is a whole number of octaves. For $\alpha=1/4$ no integer $n$ closes the chain exactly, but $n=31$ comes close: 31 quarter-comma fifths ($31\times696.578=21593.9$ ¢) fall 6.1 ¢ short of 18 octaves, whereas 12 of them fall 41 ¢ off. Spreading that shortfall over the 31 fifths gives the 31-TET fifth, 0.2 ¢ wider than the quarter-comma fifth, so 31-TET is the closed version of the quarter-comma chain. Likewise 19 third-comma fifths ($19\times694.786=13200.9$ ¢) overshoot 11 octaves by only 0.9 ¢. The seventh harmonic comes out well in 31 because the same chain of fifths happens to reach it with a 1.1 ¢ error.`,
      caption: String.raw`Left: the errors, from the pure ratios, of the fifth, major and minor third, harmonic seventh and the septimal minor third 7/6 in 12-, 19- and 31-TET. Right: the pitch circle of the selected division (ticks, one per step) with the just ratios marked; the orange dots are the chain of meantone fifths (quarter-comma for 31, third-comma for 19, equal for 12) whose notes the steps reproduce. Play the major triad and the 4:5:6:7 chord in the chosen division, against 12-TET.`,
      deps: ['music-7.11', 'music-7.7'],
      see: ['music-7.13', 'music-6.11', 'music-7.17'],
      refs: ['Benson ch. 6'],
      tags: ['equal temperament', 'meantone'],
      credit: '19-TET: Salinas, 1577 (as one-third-comma meantone), Woolhouse, 1835; 31-TET: Huygens, 1691 (Lemme Rossi proposed it in 1666), revival by Fokker, 1950s (31-tone organ, 1951)',
      scope: String.raw`Exact arithmetic for equal divisions; the historical attributions are from secondary sources. 19-TET's major third is flat and 31-TET's fifth is wider than the quarter-comma fifth by only 0.2 ¢. Neither division reproduces 3/2 as accurately as 12-TET (1.96 ¢ error against 5.2 and 7.2 ¢).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/31_equal_temperament' },
      verify: true,
      viz(v) {
        const EDOS = [12, 19, 31], COL = ['muted', 'accent', 'orange'];
        const which = v.select('division', EDOS.map((x) => ({ value: x, label: `${x}-TET` })), 31);
        const IV = [[3, 2, 'fifth'], [5, 4, 'major third'], [6, 5, 'minor third'], [7, 4, 'harm. seventh'], [7, 6, '7/6']];
        const eb = v.stage({ x: [-0.6, 4.6], y: [-36, 36], axes: 'box', gutter: true, height: 340, xticks: IV.map((x, i) => [i, `${x[0]}/${x[1]}`]), yticks: [-30, -15, 0, 15, 30].map((y) => [y, String(y)]), ylabel: 'error from the pure ratio (¢)', title: 'errors of three equal divisions' });
        const rg = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 340, title: 'the pitch circle' });
        const snd = v.sound();
        const GEN = { 12: 700, 19: cents(1.5) - SCOMMA / 3, 31: cents(1.5) - SCOMMA / 4 };
        const steps = (n, r) => edoApprox(n, cents(r))[0];
        const tri = (n) => [0, (steps(n, 5 / 4) * 1200) / n, (steps(n, 3 / 2) * 1200) / n], sev = (n) => tri(n).concat([(steps(n, 7 / 4) * 1200) / n]);
        v.soundButton('triad: 12-TET, then this division', (sd) => sd.samples(seqCents([tri(12), tri(which.value)], C4, 1.7, 0.2), SR, { gain: 0.9 }));
        v.soundButton('4:5:6:7: 12-TET, then this division', (sd) => sd.samples(seqCents([sev(12), sev(which.value)], C4, 1.7, 0.2), SR, { gain: 0.9 }));
        v.soundButton('4:5:6:7 pure', (sd) => sd.samples(seqCents([[0, M3J, FIFTH, cents(7 / 4)]], C4, 2.0, 0), SR, { gain: 0.9 }));
        v.render(() => {
          eb.hline(0, { color: 'green', width: 1.6 });
          IV.forEach(([p, q], i) => EDOS.forEach((n, j) => { const e = edoApprox(n, cents(p / q))[1], x = i + (j - 1) * 0.27, c = COL[j]; eb.rect(x - 0.12, 0, x + 0.12, e, { fill: c, fillAlpha: n === which.value ? 0.75 : 0.35, color: c }); eb.text(sc(v, e, 1), x, e, { size: 9, align: 'center', baseline: e >= 0 ? 'bottom' : 'top', dy: e >= 0 ? -2 : 2, color: 'muted' }); }));
          const n = which.value;
          ring(rg, 1, { tick: 1200 / n, len: 0.05 });
          for (let c = 0; c < n; c++) { if (n <= 31) { const p = circ((c * 1200) / n, 0.85); rg.dot(p[0], p[1], { r: 2, color: 'faint' }); } }
          const g = GEN[n], seen = new Set();
          for (let k = -Math.floor(n / 2); k <= Math.floor(n / 2); k++) { const c = fold(k * g), p = circ(c, 0.74); rg.dot(p[0], p[1], { r: 3.2, color: 'orange' }); }
          IV.slice(0, 4).forEach(([p, q]) => { const c = cents(p / q), a = circ(c, 1.0), b = circ(c, 1.16); rg.dot(a[0], a[1], { r: 4.5, color: 'green' }); rg.text(`${p}/${q}`, b[0], b[1], { size: 11, color: 'green', align: 'center', baseline: 'middle', weight: 700 }); });
          rg.text(`${n}-TET`, 0, 0.05, { size: 14, align: 'center', weight: 700 }); rg.text(`step ${v.fix(1200 / n, 2)} ¢`, 0, -0.12, { size: 11, color: 'muted', align: 'center' });
        });
        v.legend([['green', 'pure ratio'], ['orange', 'meantone chain of fifths'], ['faint', 'steps of the division']]);
        v.readout(() => {
          const n = which.value, g = GEN[n], f = (r) => { const [k, e] = edoApprox(n, cents(r)); return `${k} steps = ${v.fix((k * 1200) / n, 2)} ¢ (${sc(v, e, 2)})`; };
          const mx = Math.max(...Array.from({ length: n }, (_, i) => { const k = i - Math.floor(n / 2), c = k * g, e = Math.abs(c - (Math.round((c * n) / 1200) * 1200) / n); return e; }));
          return `${n}-TET: fifth ${f(1.5)} · major third ${f(1.25)} · minor third ${f(1.2)} · seventh ${f(1.75)} · the ${n === 12 ? 'equal 700 ¢' : n === 19 ? 'one-third-comma' : 'quarter-comma'} fifth is ${v.fix(g, 3)} ¢ against the division's ${v.fix((steps(n, 1.5) * 1200) / n, 3)} ¢; along a chain of ${n} fifths the two differ by at most ${v.fix(mx, 1)} ¢`;
        });
      },
    },
  ],
};
