import { EDO_TARGETS, edoRecordModel, edoRecordAudio, edoCompareModel, edoCompareAudio } from './source-audit-edo.js';
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
      num:'7.11',kind:'Theorem',name:'Why twelve: 7/12 is a convergent of log₂(3/2)',
      statement:String.raw`For a target ratio $r$ and an $n$-step equal division of the octave, its nearest step is $k=\operatorname{round}(n\alpha)$, where $\alpha=\log_2r$. Its signed error in cents is
$$1200(k/n-\alpha).$$
For the fifth $r=3/2$, strict record improvements as $n$ runs from 3 through 700 occur at $3,5,7,12,29,41,53,200,253,306,359,665$. This is a finite computed statement, independently checked with rational bounds on the logarithm.

The convergent $7/12$ has second-kind error $|12\alpha-7|\approx0.019550009$. No positive denominator below 41 has a smaller second-kind error (7.10). For cents error, 12 remains unbeaten until 29; 24 ties 12 because $14/24=7/12$. These are different optimization criteria.`,
      idea:String.raw`At fixed $n$, minimizing cents error is choosing the integer nearest $n\alpha$. The second-kind error of 7.10 is $|n\alpha-k|$; cents error divides this by $n$ and multiplies by 1200. A fraction can improve the latter without improving the former: $4/7$ is closer to $\alpha$ than $3/5$, but has larger $|n\alpha-k|$.

The record lists here are exhaustive finite searches, not a proof that twelve notes is uniquely optimal or historically inevitable. Continued fractions explain why convergents such as $7/12,24/41,31/53$ recur. The extra cents-record fractions require their own comparison; a good fifth alone gives no assertion about thirds, timbre or perceived quality.`,
      caption:String.raw`Choose the fifth, major third or harmonic seventh and an integer division $n=3,\ldots,120$. All118 displayed errors are positive and fit the logarithmic axis. Orange marks strict cents records within that range; gold is the selected division. The two audio buttons compare the selected target's actual approximation with its pure ratio, using the same C4 anchor.`,
      deps:['music-7.10','music-7.9'],see:['music-7.12','music-7.13','music-7.2'],
      refs:['Benson, Music: A Mathematical Offering, Web version14Dec2008, §6.2, pp.204–208; nearest-step and finite-record comparisons derived here'],tags:['equal temperament','continued fractions'],
      credit:'Tuning and continued-fraction exposition: Dave Benson; bounded record enumeration and synthesis authored here.',
      scope:String.raw`An exact nearest-integer formula and a finite numerical comparison, not a historical account of the choice of 12 notes. Independent rational log-series bounds certify every nearest step and strict record decision through 700. The visual control stops at 120; its displayed decimals use binary64 evaluation. Audio uses C4=261.6256Hz and the declared H8/44,100-Hz signal of 7.4/7.9; measured audibility is not inferred from the cents error.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify:false,
      viz(v){
        const target=v.select('target',[{value:'fifth',label:'fifth 3/2'},{value:'major',label:'major third 5/4'},{value:'seventh',label:'harmonic seventh 7/4'}],'fifth'),N=v.slider('notes per octave n',3,120,12,{int:true});
        const A=v.stage({x:[-3,126],y:[.0001,400],ylog:true,axes:'box',gutter:true,full:true,height:350,minWidth:240,xlabel:'notes per octave n',ylabel:'absolute error (cents)',xticks:[3,12,31,53,80,120],title:'all 118 nearest-step errors; strict cents records in orange'});
        let info;v.soundButton('Play selected approximation',sd=>{const a=edoRecordAudio(N.value,target.value,'tempered');sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});});v.soundButton('Play pure target',sd=>{const a=edoRecordAudio(N.value,target.value,'pure');sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});});v.button('Stop audio',()=>v.sound().stop());
        v.render(()=>{const a=edoRecordModel(N.value,target.value);info=a;A.dots(a.points.map(x=>[x.n,Math.abs(x.error)]),{r:2.2,ring:false,color:'accent'});a.points.filter(x=>x.record).forEach(x=>A.dot(x.n,Math.abs(x.error),{r:4.5,ring:false,color:'orange'}));A.dot(a.n,Math.abs(a.current.error),{r:6,ring:false,color:'gold'});});
        v.legend([['accent','every division 3–120'],['orange','strict cents record from n=3'],['gold','selected division']]);
        v.readout(()=>{const a=info,x=a.current;return `n=${x.n}: ${x.k} steps approximate ${x.p}/${x.q}; ${v.fix(x.cents,6)} cents, signed error ${x.error<0?'−':'+'}${v.fix(Math.abs(x.error),6)} cents. Second-kind error |nα−k|=${v.fix(x.stepError,9)}. Strict cents records over 3–120: ${a.records.join(', ')}. These compare mathematical intervals, not musical quality.`;});
      },
    },
    // ------------------------------------------------------------------ 7.12
    {
      num:'7.12',kind:'Concept',name:'19- and 31-tone equal temperament',
      statement:String.raw`An $n$-tone equal temperament has step ratio $2^{1/n}$ and step size $1200/n$ cents. Its nearest approximation to ratio $r$ uses $k=\operatorname{round}(n\log_2r)$ steps.

For 19-TET, the fifth is 11 steps (694.736842 cents), major third 6 steps (378.947368) and minor third 5 steps (315.789474). For 31-TET these use 18, 10, 8 steps (696.774194,387.096774,309.677419 cents), and 25 steps approximate $7/4$ at 967.741935 cents. All decimals are rounded. The full table includes signed errors for these intervals and $7/6$ in 12-, 19- and 31-TET.

The 19-TET fifth is about 0.0494 cents below the third-comma generator; the 31-TET fifth is about 0.1958 cents above the quarter-comma generator. They approximate these meantone systems rather than equaling them. Their fifth steps generate all pitches because $\gcd(11,19)=\gcd(18,31)=1$.`,
      idea:String.raw`The quarter-comma generator has ratio $5^{1/4}$ (7.7), hence size $300\log_2 5$ cents. It cannot close after any positive integer number of steps: $5^{m/4}=2^j$ would force $5^m=2^{4j}$, contradicting prime factorization. 31 copies fall short of 18 octaves by about 6.07 cents. Adding that shortfall divided by 31 to each generator gives the exact 31-TET fifth, 18 octave steps out of 31. A similar comparison uses third-comma meantone and 11/19 of an octave.

If a step count $k$ is coprime to $n$, multiplication by $k$ permutes the residues modulo $n$. Thus repeated equal-tempered fifths reach every pitch exactly once before returning. This algebraic closure is distinct from the near closure of the corresponding pure meantone generator.`,
      caption:String.raw`Select 12, 19 or 31. The first plot compares all five signed interval errors with separate markers for the three divisions; the table lists every step count and error. The pitch circle shows equal-division ticks and a finite centered chain of the corresponding generator, with pure reference ratios in green. Audio compares 12-TET with the selected division for the actual major-triad or harmonic-seventh approximation; a separate button plays the pure 4:5:6:7 chord.`,
      deps:['music-7.11','music-7.7'],see:['music-7.13','music-6.11','music-7.17'],
      refs:['Benson, Music: A Mathematical Offering, Web version14Dec2008, §§6.4–6.5, pp.217–221; tables and meantone comparison'],tags:['equal temperament','meantone'],
      credit:'Technical comparison: Dave Benson; finite diagrams, step calculations and synthesis authored here.',
      scope:String.raw`Exact equal-division definitions with rounded binary64 evaluations and explicit pure-ratio references. Benson's actual 19/31 tables and meantone comparison are used; no Salinas, Woolhouse, Huygens, Rossi or Fokker priority/date claim is certified. Non-octave rational intervals are approximated, not reproduced exactly. The orange chain has exactly n authored consecutive generator exponents centered around 0; its displayed maximum is over that finite set. Audio uses the C4=261.6256-Hz, mono 44,100-Hz H8 contract of 7.4/7.9, with fixed normalization, 0.12 peak bound, 10-ms ramps and 0.1-s exact gaps. Ratios and errors do not measure consonance.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify:false,
      viz(v){
        const N=v.select('division',[12,19,31].map(value=>({value,label:`${value}-TET`})),31),COL={12:'muted',19:'accent',31:'orange'},ids=Object.keys(EDO_TARGETS);
        const A=v.stage({x:[-24,43],y:[-.65,4.65],axes:'box',gutter:true,full:true,height:330,minWidth:240,xlabel:'signed error from pure (cents)',yticks:ids.map((id,j)=>[4-j,`${EDO_TARGETS[id][0]}/${EDO_TARGETS[id][1]}`]),title:'all five interval errors in 12-, 19- and 31-TET'});
        const B=v.stage({x:[0,1],y:[-.4,16.8],axes:false,full:true,height:540,minWidth:240,title:'all15 comparisons: division, ratio, nearest step and error'});
        const C=v.stage({x:[-1.5,1.5],y:[-1.45,1.45],equal:true,axes:false,height:350,minWidth:240,title:'equal-division ticks and finite generator chain'});
        let info;for(const[action,label]of[['triad','Triad:12-TET then selected'],['seventh','Harmonic seventh:12-TET then selected'],['pure','Pure4:5:6:7']])v.soundButton(label,sd=>{const a=edoCompareAudio(N.value,action);sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});});v.button('Stop audio',()=>v.sound().stop());
        const point=(c,r)=>[r*Math.sin(c*Math.PI/600),r*Math.cos(c*Math.PI/600)];
        v.render(()=>{const a=edoCompareModel(N.value);info=a;A.line(0,-.4,0,4.4,{color:'green',width:1});
          a.rows.forEach(r=>{const j=ids.indexOf(r.target),offset=([12,19,31].indexOf(r.n)-1)*.17;A.dot(r.error,4-j+offset,{r:r.n===a.n?5:3,ring:false,color:COL[r.n]});});
          [['N',.06],['ratio',.29],['k',.52],['error(¢)',.95]].forEach(([t,x])=>B.text(t,x,16,{size:10.5,align:x===.95?'right':'center',baseline:'middle',weight:700}));
          a.rows.forEach((r,j)=>{const y=15-j,col=r.n===a.n?COL[r.n]:'muted';B.text(String(r.n),.06,y,{size:11,align:'center',baseline:'middle',color:col});B.text(`${r.p}/${r.q}`,.29,y,{size:11,align:'center',baseline:'middle',color:col});B.text(String(r.k),.52,y,{size:11,align:'center',baseline:'middle',color:col});B.text(`${r.error<0?'−':'+'}${v.fix(Math.abs(r.error),3)}`,.95,y,{size:10.5,align:'right',baseline:'middle',color:col});});
          C.circle(0,0,1,{color:'muted',width:1});for(let j=0;j<a.n;j++){C.line(...point(j*1200/a.n,.95),...point(j*1200/a.n,1),{color:'muted',width:1});}a.chain.forEach(x=>C.dot(...point(x.meantone,.76),{r:3,ring:false,color:'orange'}));
          for(const id of['fifth','major','minor','seventh']){const[p,q]=EDO_TARGETS[id],c=1200*Math.log2(p/q);C.dot(...point(c,1),{r:4,ring:false,color:'green'});C.text(`${p}/${q}`,...point(c,1.19),{size:11,align:'center',baseline:'middle',color:'green'});}
          C.text(`${a.n}-TET`,0,.06,{size:14,align:'center',baseline:'middle'});C.text(`step ${v.fix(a.step,4)}¢`,0,-.15,{size:11,align:'center',baseline:'middle',color:'muted'});
        });
        v.legend([['muted','12-TET'],['accent','19-TET'],['orange','31-TET / generator chain'],['green','pure reference']]);
        v.readout(()=>{const a=info;return `${a.n}-TET fifth: ${a.fifth.k}/${a.n} octave = ${v.fix(a.fifth.cents,9)} cents. Comparison generator ${v.fix(a.generator,9)} cents; generator−equal fifth ${v.fix(a.generator-a.fifth.cents,9)} cents. Generator closure error after ${a.n} steps: ${v.fix(a.closureError,6)} cents. Maximum displacement of the displayed ${a.n}-point centered chain: ${v.fix(a.maxChainError,6)} cents. Actual selected triad ${a.triad.map(x=>v.fix(x,6)).join(', ')}Hz; seventh approximation ${a.seventh.map(x=>v.fix(x,6)).join(', ')}Hz. These are mathematical approximations, not a consonance score.`;});
      },
    },
  ],
};
