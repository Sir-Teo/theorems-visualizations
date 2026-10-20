import{PERIODICITY_PRESETS,periodicityModel,periodicityHit,periodicityStateValid,periodicityAudio}from'./source-audit-periodicity.js';
import{fiftyThreeModel,fiftyThreeAudio,circleModel,circleHit,circleAudio,CIRCLE_NAMES}from'./source-audit-circle53.js';
// Music Theory & Acoustics — Chapter 7: Tuning and temperament (part c: items 7.13–7.17)
import { SR, C4, FIFTH, PCOMMA, SCOMMA, M3J, NOTE, TIM, sc, fold, circ, ring, cents, gcd, seqCents, chordCents, edoApprox, J5, harmonic, at, dissAll, dissCurve, minima } from './ch07.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export default {
  collection: 'music',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.13
    {
      num:'7.13',kind:'Concept',name:'53-tone equal temperament',
      statement:String.raw`53-TET divides the octave into 53 equal frequency ratios, each $2^{1/53}$ or $1200/53$ cents. Its nearest fifth uses 31 steps (701.886792 cents), major third 17 (384.905660) and minor third 14 (316.981132). The corresponding signed errors are approximately−0.068208,−1.408053 and+1.339845 cents.

These small errors concern particular intervals, not every five-limit ratio. For example, $25/16$ is also five-limit, and its nearest 34 steps have error about−2.816107 cents. The eleven declared conventional references in the table have maximum absolute error about 1.544470 cents. Every octave interval has a nearest 53-TET step within $600/53\approx 11.320755$ cents, which is the general rounding bound.

The exact ratio between 53 pure fifths and 31 octaves is $3^{53}/2^{84}>1$, with logarithmic excess about 3.615046 cents.`,
      idea:String.raw`The convergent 31/53 of $\log_2(3/2)$ gives the close fifth approximation. The major third is a separate approximation,17/53 of an octave. If prime 3 and prime 5 are assigned 84 and 123 steps, respectively, the error assigned to a ratio $2^a 3^b 5^c$ is a linear combination of the errors for those primes. Larger exponents can accumulate larger errors; nearest-step rounding may then choose a different count. The finite table does not bound the entire five-limit lattice.

For $25/16=(5/4)^2$, the assigned 34-step error is twice that of 17 steps against 5/4, giving an explicit counterexample to a universal 1.5-cent claim. The bound 600/53 follows because rounding changes an octave coordinate by at most half of a 53-TET step.`,
      caption:String.raw`Select one of three explicitly voiced rational chords. The circle shows 53 grid ticks and the selected chord's pure ratios (green) versus its 53-TET notes (blue, at a separate radius). The complete table compares eleven declared references and the 25/16 counterexample with both 53-TET and 12-TET. Playback uses the printed C4-anchored register for each version; alternate plays rational and 53-TET events in turn.`,
      deps:['music-7.11','music-7.5'],see:['music-7.15','music-7.12','music-7.2'],
      refs:['Benson, Music: A Mathematical Offering, Web version14Dec2008, §6.3, pp.213–216; declared reference table and25/16 counterexample computed here'],tags:['equal temperament','just intonation'],
      credit:'Technical53-TET exposition: Dave Benson; finite reference table, counterexample and synthesis authored here.',
      scope:String.raw`A mathematical finite comparison. The ratio list is declared rather than a unique five-limit scale, and no universal 1.5-cent or listener-threshold claim is made. Historical priority and naming of the 53-fifth closure excess are outside this claim. Integer step counts and the prime-power ratio are exact definitions; decimal logarithms/frequencies are numerical evaluations. Audio is the C4=261.6256-Hz,44,100-Hz H8 signal specified in 7.4/7.9, with pre-output bound 0.12 and 10-ms ramps; no perceived-beat or consonance certificate is inferred.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify:false,
      viz(v){
        const chord=v.select('chord',[{value:'major',label:'major triad 4:5:6'},{value:'minor',label:'minor triad 10:12:15'},{value:'major7',label:'major seventh 8:10:12:15'}],'major');
        const A=v.stage({x:[-1.5,1.5],y:[-1.45,1.45],equal:true,axes:false,full:true,height:350,minWidth:240,title:'53 equal ticks and the selected chord'}),B=v.stage({x:[0,1],y:[-.5,12.7],axes:false,full:true,height:440,minWidth:240,title:'declared rational references and signed errors (cents)'});
        let info;for(const[action,label]of[['just','Play rational chord'],['53','Play 53-TET chord'],['12','Play 12-TET chord'],['alternate','Alternate rational / 53-TET']])v.soundButton(label,sd=>{const a=fiftyThreeAudio(chord.value,action);sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});});v.button('Stop audio',()=>v.sound().stop());
        const point=(c,r)=>[r*Math.sin(c*Math.PI/600),r*Math.cos(c*Math.PI/600)];
        v.render(()=>{const a=fiftyThreeModel(chord.value);info=a;A.circle(0,0,1,{color:'muted',width:1});for(let j=0;j<53;j++)A.line(...point(j*1200/53,.95),...point(j*1200/53,1),{color:'muted',width:1});a.notes.forEach(n=>{const c=1200*Math.log2(n.p/n.q),e=1200*Math.log2(n.in53/261.6256);A.dot(...point(c,1),{r:5,ring:false,color:'green'});A.dot(...point(e,.82),{r:4,ring:false,color:'accent'});A.text(n.exact,...point(c,1.2),{size:11,align:'center',baseline:'middle',color:'green'});});A.text('53-TET',0,.06,{size:15,align:'center',baseline:'middle'});A.text('selected chord',0,-.15,{size:11,align:'center',baseline:'middle',color:'muted'});
          [['ratio',.15],['k53',.4],['53−ref',.7],['12−ref',.95]].forEach(([t,x])=>B.text(t,x,12.05,{size:10.5,align:x>.5?'right':'center',baseline:'middle',weight:700}));a.rows.forEach((r,j)=>{const y=11-j,col=r.counterexample?'gold':'accent';B.text(r.exact,.15,y,{size:11,align:'center',baseline:'middle',color:r.counterexample?'gold':'ink'});B.text(String(r.in53.k),.4,y,{size:11,align:'center',baseline:'middle',color:col});B.text(`${r.in53.error<0?'−':'+'}${v.fix(Math.abs(r.in53.error),3)}`,.7,y,{size:10.5,align:'right',baseline:'middle',color:col});B.text(`${r.in12.error<0?'−':'+'}${v.fix(Math.abs(r.in12.error),3)}`,.95,y,{size:10.5,align:'right',baseline:'middle',color:'muted'});});
        });v.legend([['green','selected pure ratio'],['accent','53-TET'],['muted','12-TET table'],['gold','25/16 counterexample']]);
        v.readout(()=>{const a=info;return `Maximum absolute 53-TET error over the eleven declared references: ${v.fix(a.maxCuratedError,9)} cents. 25/16 counterexample: ${v.fix(a.counterexample.in53.error,9)} cents. 53-fifth closure excess: ${v.fix(a.commaCents,9)} cents; the exact prime-power ratio is 3⁵³/2⁸⁴. Actual rational / 53-TET /12-TET chord frequencies (Hz): ${a.notes.map(n=>`${v.fix(n.just,6)} /${v.fix(n.in53,6)} /${v.fix(n.in12,6)}`).join('; ')}. Small numerical errors do not establish an audibility threshold.`;});
      },
    },
    // ------------------------------------------------------------------ 7.14
    {
      num:'7.14',kind:'Concept',name:'The circle of fifths',
      statement:String.raw`In 12-TET, adding a fifth advances 7 semitones modulo 12; because 7 and 12 are coprime, twelve steps visit every pitch class and return to the start. The conventional major-key signatures form the same circle: neighboring major scales differ by one note. A natural minor scale shares its key signature with the major scale three semitones above it.

For a chain with a constant fifth size $f$ in the displayed 700-to-pure-fifth range, the twelve-step excess above seven octaves is $12(f-700)$ cents. It vanishes only at $f=700$. Pure fifths give the Pythagorean comma, and the last spelled B♯ differs from C.

An unequal twelve-fifth tuning can also close: its fifth sizes need only sum to 8400 cents (7.8). That condition does not make all keys' interval patterns identical. The widget's uniform-fifth family is one specific mathematical comparison.`,
      idea:String.raw`Octave equivalence means reducing pitch in cents modulo 1200. Twelve equal 700-cent steps sum to 8400. With pure fifths the sum is 8400 plus the comma; continuously reducing every fifth by the same share removes that excess. If fifths vary, closure constrains only their total, not every four-fifth major third. The named circulating recipes in 7.8 are concrete examples.

Benson's Appendix M demonstrates the key-signature relationship with C/G and C/F major, and describes relative natural minors. Those notational facts are distinct from whether differently spelled notes have exactly the same frequency in a chosen tuning. This diagram therefore retains the actual forward-chain spellings C,G,…,E♯,B♯.`,
      caption:String.raw`Choose the continuous tempering amount and a chain note. Gold selects its actual visible node; clicks near nodes select and play a triad, while empty space does nothing. Angular positions encode chain order. Authored radial growth encodes accumulated excess, not frequency distance. The red endpoint is step 12 (B♯), which coincides with C only at the equal endpoint. The walk plays twelve subsequent triads, rooted on steps 1–12; the closing-pair button directly compares the final root with the C4 anchor.`,
      deps:['music-7.9','music-7.2','music-7.8'],see:['music-7.4','music-8.4','music-8.20'],
      refs:['Benson, Music: A Mathematical Offering, Web version14Dec2008, §§5.3–5.4, pp.155–158; Appendix M, pp.393–394'],tags:['circle of fifths'],
      credit:'Tuning and key-signature exposition: Dave Benson; continuous uniform-fifth diagram and synthesis authored here.',
      scope:String.raw`A specified constant-fifth family with registered controls, rather than a simulation of every well temperament. The final note's unison with C is exact at the equal endpoint; intermediate calculations and decimal readouts use binary 64. Every audio root is folded into C4–C5, and its two upper voices ascend by the displayed four-fifth major third and fifth. C4 is 261.6256Hz. Audio uses the mono 44,100-Hz H8 contract of 7.4/7.9 with pre-output bound 0.12 and 10-ms ramps. No subjective key-character or perceptual equality is inferred.`,
      links:{source:'https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf'},verify:false,
      viz(v){
        const tau=v.slider('tempering: pure to equal',0,1,0,{step:'any',decimals:9}),selected=v.slider('selected chain note',0,11,0,{int:true,fmt:x=>CIRCLE_NAMES[x]});
        const A=v.stage({x:[-1.8,1.8],y:[-1.8,1.8],equal:true,axes:false,full:true,height:390,minWidth:240,title:'chain order; radial displacement encodes accumulated excess'});let info;
        const play=(action,sd=v.sound())=>{const a=circleAudio(tau.value,selected.value,action);sd.stop();sd.samples(a.samples,a.sampleRate,{gain:1,normalize:false});};v.soundButton('Play selected triad',sd=>play('triad',sd));v.soundButton('Play twelve subsequent triads',sd=>play('walk',sd));v.soundButton('Compare C4 and final root',sd=>play('closing',sd));v.button('Stop audio',()=>v.sound().stop());A.onClick((x,y)=>{const j=circleHit(tau.value,x,y);if(j!==null){selected.set(j);play('triad');}});
        v.render(()=>{const a=circleModel(tau.value,selected.value);info=a;A.circle(0,0,1,{color:'muted',width:1,dash:[4,4]});A.path(a.path,{color:'orange',width:2});const end=a.path[12];A.dot(...end,{r:8,hollow:true,color:'red',width:2});a.nodes.forEach(n=>{A.dot(...n.point,{r:n.j===a.selected?6:4.5,ring:false,color:n.j===a.selected?'gold':'accent'});const j=n.j,r=Math.hypot(...n.point),factor=j===0?.78/r:1+.17/r;A.text(n.name,n.point[0]*factor,n.point[1]*factor,{size:12,align:'center',baseline:'middle'});});A.text(`selected ${a.chosen.name}`,0,.12,{size:13,align:'center',baseline:'middle',color:'gold'});A.text(`${v.fix(a.fifth,6)} cents/fifth`,0,-.12,{size:11,align:'center',baseline:'middle',color:'muted'});});
        v.legend([['accent','forward-chain notes'],['gold','selected note'],['red','step 12 B♯'],['orange','authored chain path']]);v.readout(()=>{const a=info;return `Fifth ${v.fix(a.fifth,9)} cents; twelve-step excess ${v.fix(a.error,9)} cents. ${a.closed?'Equal endpoint: B♯ and C coincide.':'The final B♯ differs from C.'} Actual C4/final-root pair ${a.closing.map(x=>v.fix(x,6)).join(', ')}Hz. Selected ${a.chosen.name} upward triad ${a.triad.map(x=>v.fix(x,6)).join(', ')}Hz. The plot is an authored chain-order diagram; its radius is not a frequency.`;});
      },
    },
    // ------------------------------------------------------------------ 7.15
    {
      num:'7.15',kind:'Theorem',name:'Unison vectors and periodicity blocks (Fokker)',
      statement:String.raw`Write a five-limit pitch class as $3^a5^b$ modulo octaves, with $(a,b)\in\Z^2$. Given independent integer vectors $u,v$, the half-open parallelogram $P=\{su+tv:0\le s,t<1\}$ contains exactly $|\det(u,v)|$ lattice points. Every lattice point differs from exactly one of these representatives by an integer combination of $u$ and $v$.

This counts classes of $\Z^2/\langle u,v\rangle$. It gives that many distinct tempered pitches only when the pitch map has exactly this kernel. For example, $u=(2,0),v=(0,2)$ give four classes, but any map to octave pitch classes that kills both vectors has at most two distinct images: both generators must map to either 0 or 600 cents.

For each offered $n$-TET preset, the source pair has determinant magnitude $n$ and lies in the kernel of $a m_3+b m_5\pmod n$. This map is onto, so the pair spans its full kernel and the block represents every one of the $n$ steps exactly once.`,
      idea:String.raw`For any integer point $z$, write $(s,t)=[u\ v]^{-1}z$ and subtract $\lfloor s\rfloor u+\lfloor t\rfloor v$. The result is an integer point in $P$. Two points of $P$ cannot differ by a nonzero integer combination of $u,v$, because their two coefficient differences lie strictly between −1 and 1. Integer row and column operations reduce the generator matrix to a diagonal one while preserving index and determinant magnitude; the diagonal case has exactly the product of its diagonal magnitudes as classes.

For a preset, $\gcd(n,m_3,m_5)=1$ makes the modular map onto. Its kernel therefore has index $n$. The generated sublattice lies inside that kernel and also has index $n$, so they are equal. Free vectors retain the exact class count; no arbitrary free quotient is asserted to be a faithful musical scale.`,
      caption:String.raw`Choose one of Fokker's displayed two-dimensional vector pairs, or edit bounded integer vectors. The left panel contains the entire block; blue marks its exact half-open representatives. The middle panel plots their coefficient coordinates $(s,t)$ in a square with opposite edges identified. The right panel shows those representatives as pure ratios, or as distinct equal-tempered steps for a preset. Click a blue lattice point to select and hear it. The sequence button plays only the first twelve representatives in ascending displayed pitch order, explicitly limiting long free blocks.`,
      deps:['music-7.6','music-7.3'],see:['music-7.5','music-7.13','music-7.12'],
      refs:['A. D. Fokker, 1969, Unison vectors and periodicity blocks in the three-dimensional (3-5-7-) harmonic lattice of notes; Huygens–Fokker Foundation hosted transcription, sections The lattice, Unison vectors and Periodicity blocks (two-dimensional table)'],tags:['lattice','comma'],
      credit:'Source vector pairs: A. D. Fokker (1969), hosted transcription. Exact half-open enumeration, kernel qualification and counterexample derived here.',
      scope:String.raw`The lattice-class theorem holds for independent integer vectors. The widget allows coordinates −12 through 12, including singular pairs to test the independence hypothesis. Preset modular steps are explicitly assigned by rounding $n\log_2 3$ and $n\log_2 5$; the source table supplies vector pairs, not a shortest-vector algorithm or a claim that every determinant quotient is cyclic. The square represents a continuous torus containing the finite lattice classes, not an audible pitch circle. Pure representatives are exact rational ratios modulo powers of two, with numerical logarithms for display. Free choice has no tempering toggle. Audio is the mono 44,100-Hz C4=261.6256-Hz H8 signal of 7.4/7.9, bounded by 0.12 before output and with 10-ms ramps; no listener threshold is claimed.`,
      links:{source:'https://www.huygens-fokker.org/docs/fokkerpb.html'},verify:false,
      viz(v){
        let selected=[0,0],info;
        const reset=()=>{selected=[0,0];};
        const ps=v.select('vector pair',PERIODICITY_PRESETS.map(p=>({value:p.n,label:`${p.n}-TET`})).concat([{value:0,label:'free vectors'}]),12,{onChange:reset});
        const ua=v.slider('u: fifth coordinate',-12,12,0,{int:true,onChange:reset}),ub=v.slider('u: third coordinate',-12,12,-3,{int:true,onChange:reset}),va=v.slider('v: fifth coordinate',-12,12,4,{int:true,onChange:reset}),vb=v.slider('v: third coordinate',-12,12,-1,{int:true,onChange:reset});
        const tmp=v.toggle('map preset to equal-tempered steps',false),model=()=>periodicityModel(ps.value,[ua.value,ub.value],[va.value,vb.value],tmp.value,selected);
        const A=v.stage({x:[-1.4,5.4],y:[-5.4,1.4],equal:true,axes:false,full:true,height:390,minWidth:240,title:'complete lattice block: fifth coordinate →, third coordinate ↑'}),B=v.stage({x:[-.16,1.16],y:[-.16,1.16],equal:true,axes:false,full:true,height:330,minWidth:240,title:'coefficient square: opposite edges identified'}),C=v.stage({x:[-1.4,1.4],y:[-1.4,1.4],equal:true,axes:false,full:true,height:330,minWidth:240,title:'pitch classes of these representatives'});
        v.shareState('periodicity selected representative',{get:()=>({n:ps.value,u:[ua.value,ub.value],v:[va.value,vb.value],point:selected.slice()}),validate:periodicityStateValid,set:data=>{if(data.n!==ps.value||data.u[0]!==ua.value||data.u[1]!==ub.value||data.v[0]!==va.value||data.v[1]!==vb.value)throw new RangeError('Saved representative and restored vectors disagree');selected=data.point.slice();}});
        const play=(action,sd=v.sound())=>{const a=model();if(!a.valid)return;const audio=periodicityAudio(a,action);sd.stop();sd.samples(audio.samples,audio.sampleRate,{gain:1,normalize:false});};
        v.soundButton('Play selected representative',sd=>play('selected',sd));v.soundButton('Play first twelve representatives',sd=>play('sequence',sd));v.button('Stop audio',()=>v.sound().stop());
        A.onClick((x,y)=>{const p=periodicityHit(model(),x,y);if(p){selected=[p.a,p.b];play('selected');}});
        v.render(()=>{const a=model();info=a;for(const c of[ua,ub,va,vb])c.el.hidden=ps.value!==0;tmp.el.hidden=ps.value===0;A.setView(a.bounds.x,a.bounds.y);const radius=Math.max(2,Math.min(4.5,32/Math.sqrt(Math.max(1,a.size))));
          A.path([...a.vertices,a.vertices[0]],{color:'accent',width:1.4});A.arrow(0,0,...a.u,{color:'red',width:2});A.arrow(0,0,...a.v,{color:'orange',width:2});B.rect(0,0,1,1,{color:'muted',width:1.4});C.circle(0,0,1,{color:'muted',width:1});
          for(const p of a.points){const chosen=p.a===a.chosen.a&&p.b===a.chosen.b,col=chosen?'gold':'accent';A.dot(p.a,p.b,{r:chosen?5:radius,color:col,ring:false});B.dot(p.x,p.y,{r:chosen?5:radius,color:col,ring:false});C.dot(Math.sin(p.cents*Math.PI/600),Math.cos(p.cents*Math.PI/600),{r:chosen?5:Math.min(radius,3.5),color:col,ring:false});}
          if(a.chosen){C.text(`${a.size} classes`,0,.12,{size:16,align:'center',baseline:'middle'});C.text(a.tempered?`${a.n}-TET`:'pure representatives',0,-.12,{size:11,align:'center',baseline:'middle',color:'muted'});}else{for(const s of[A,B,C])s.text('dependent vectors: no finite block',s===A?(a.bounds.x[0]+a.bounds.x[1])/2:s===B?.5:0,s===A?(a.bounds.y[0]+a.bounds.y[1])/2:s===B?.5:0,{size:11,align:'center',baseline:'middle',color:'red'});}
        });
        v.legend([['red','vector u'],['orange','vector v'],['accent','half-open representative'],['gold','selected representative']]);
        v.readout(()=>{const a=info;if(!a.valid)return `u=(${a.u}), v=(${a.v}); determinant 0. Independence fails, so this is not a finite-index lattice block. Playback is inactive. Choose independent vectors.`;const p=a.chosen;return `u=(${a.u}), v=(${a.v}); signed determinant ${a.D}. Exact representative count ${a.points.length} = |det|. ${a.n?`Preset map: prime 3 → ${a.m3} steps, prime 5 → ${a.m5} steps modulo ${a.n}; every step occurs once.`:'Free block: these are lattice classes; no faithful octave-pitch quotient is asserted.'} Selected (${p.a},${p.b}), coefficients (${v.fix(p.x,6)},${v.fix(p.y,6)}), ${a.tempered?`step ${p.step}`:'pure ratio 3ᵃ5ᵇ modulo octaves'}, ${v.fix(p.cents,9)} cents, ${v.fix(p.hz,6)} Hz. Sequence plays ${a.sequence.length} of ${a.points.length} representatives, sorted by displayed pitch.`;});
      },
    },
    // ------------------------------------------------------------------ 7.16
    {
      num: '7.16',
      kind: 'Method',
      name: 'Adaptive tuning',
      statement: String.raw`**Adaptive tuning** (also called dynamic or "just intonation in motion") re-tunes the notes of a chord progression as it is played, so that each chord, or each moment, is as consonant as possible. One way to define it: for every chord choose the pitches that minimise its total sensory dissonance (6.4, 6.10, the sum over all pairs of partials of the Plomp–Levelt curve), keeping notes that the chord shares with the previous one unchanged so that the melody does not jump. The result sounds in tune in every chord, but the pitch of the music is not fixed: in a progression that returns to its start the pitch generally drifts, by the syntonic comma per cycle for the progression C–Am–Dm–G–C (7.6). If instead the root of every chord is anchored to equal temperament there is no drift but the chords can only be tuned relative to their roots.`,
      idea: String.raw`Dissonance of a set of partials is a smooth function of the pitches (6.4), with sharp local minima where partials coincide, near the just ratios. Minimising it over the free notes of the chord, starting from equal temperament, lands in the nearest minimum, which is the pure triad about the held notes. Because the chords' common notes carry the pitch forward, small errors accumulate exactly as in 7.6: the optimisation does not remove the comma, it relocates it into pitch drift. Weighting each note's distance from its equal-tempered pitch trades the purity of the chords against the drift.`,
      caption: String.raw`The progression C–Am–Dm–G–C repeated. Each dot is a note of the chord, drawn at its deviation from 12-TET after the tuning has been optimised (gold: the root). Choose the rule: common tones held (the tuning follows the chords and drifts) or roots anchored to 12-TET (no drift). The slider pulls every note toward its equal-tempered pitch. Compare the sound with fixed equal temperament and read the total dissonance in the readout.`,
      deps: ['music-7.6', 'music-6.4'],
      see: ['music-6.10', 'music-6.5', 'music-7.5'],
      refs: ['Sethares ch. 8'],
      tags: ['tuning', 'dissonance'],
      credit: 'adaptive tuning after W. A. Sethares, Tuning, Timbre, Spectrum, Scale (1998/2005), ch. 8',
      scope: String.raw`A computational demonstration with 6-partial harmonic tones $0.88^{k-1}$ in Sethares's roughness model; the optimiser (Nelder–Mead from 12-TET, notes confined near their equal-tempered pitch) finds local minima, not necessarily global ones. It is an illustration of the method, not a reproduction of a particular published algorithm. Real-time retuning systems differ in how they weigh drift and purity.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Adaptive_tuning' },
      verify: true,
      viz(v) {
        const M = v.M, CHORDS = [{ n: 'C', notes: [0, 4, 7], root: 0 }, { n: 'Am', notes: [0, 4, 9], root: 9 }, { n: 'Dm', notes: [2, 5, 9], root: 2 }, { n: 'G', notes: [2, 7, 11], root: 7 }];
        const mode = v.select('rule', [{ value: 'follow', label: 'common tones held' }, { value: 'anchor', label: 'roots anchored to 12-TET' }], 'follow');
        const lam = v.slider('pull toward 12-TET', 0, 0.004, 0.0001, { step: 0.00005, fmt: (x) => v.fix(x * 1000, 2) });
        const passes = v.slider('passes', 1, 6, 3, { int: true });
        const g = v.stage({ x: [-0.3, 12.3], y: [-60, 15], axes: 'box', gutter: true, height: 340, full: true, xticks: [], xlabel: 'chord', ylabel: 'deviation from 12-TET (¢)', title: 'the retuned notes' });
        const snd = v.sound();
        const diss = (notes, d) => dissAll(notes.flatMap((s, j) => at(TIM, C4 * 2 ** ((100 * s + d[j]) / 1200))));
        const cache = {};
        const solve = () => {
          const key = `${mode.value}|${lam.value}|${passes.value}`; if (cache[key]) return cache[key];
          const out = []; let prev = null;
          for (let k = 0; k <= 4 * passes.value; k++) {
            const ch = CHORDS[k % 4], free = [], d = ch.notes.map((s, j) => { const pin = mode.value === 'anchor' ? (s === ch.root ? 0 : null) : (k === 0 ? (s === ch.root ? 0 : null) : (prev && prev.has(s) ? prev.get(s) : null)); if (pin === null) free.push(j); return pin; });
            const pinned = d.filter((x) => x !== null), x0 = pinned.length ? pinned.reduce((a, b) => a + b, 0) / pinned.length : 0;
            const f = (x) => { const dd = d.slice(); free.forEach((j, i) => { dd[j] = x[i]; }); const pen = free.reduce((a, j, i) => a + x[i] * x[i], 0); return diss(ch.notes, dd) + lam.value * pen + (x.some((q) => Math.abs(q - x0) > 35) ? 5 : 0); };
            if (free.length) { const r = M.nelderMead(f, free.map(() => x0), { step: 6, tol: 1e-7, maxIt: 400 }); free.forEach((j, i) => { d[j] = r.x[i]; }); }
            out.push({ ch, d, D: diss(ch.notes, d), D12: diss(ch.notes, ch.notes.map(() => 0)) });
            prev = new Map(ch.notes.map((s, j) => [s, d[j]]));
          }
          return (cache[key] = out);
        };
        const buf = (m) => seqCents(solve().map((c) => c.ch.notes.map((s, j) => 100 * s + (m === 'et' ? 0 : c.d[j]))), C4, 0.9, 0.06);
        v.soundButton('play: adaptive', (sd) => sd.samples(buf('ad'), SR, { gain: 0.9 }));
        v.soundButton('play: 12-TET', (sd) => sd.samples(buf('et'), SR, { gain: 0.9 }));
        v.soundButton('first C, then the last C', (sd) => { const S = solve(); sd.samples(seqCents([[S[0].d[0]], [S[S.length - 1].d[0]]], C4, 1.2, 0.15), SR, { gain: 0.9 }); });
        v.render(() => {
          const S = solve();
          g.hline(0, { color: 'muted', dash: [4, 4] });
          const lo = Math.min(-10, ...S.flatMap((c) => c.d)) - 8, hi = Math.max(8, ...S.flatMap((c) => c.d)) + 8;
          g.setView([-0.3, 4 * passes.value + 0.3], [lo, hi]);
          const voices = new Map();
          S.forEach((c, k) => c.ch.notes.forEach((s, j) => { const col = s === c.ch.root ? 'gold' : 'accent'; g.dot(k, c.d[j], { r: 4.5, color: col }); if (k) { const pv = S[k - 1].ch.notes.indexOf(s); if (pv >= 0) g.line(k - 1, S[k - 1].d[pv], k, c.d[j], { color: 'accent', width: 1.2, alpha: 0.35 }); } }));
          S.forEach((c, k) => g.text(c.ch.n, k, hi - 2, { size: 11, color: k % 4 === 0 ? 'gold' : 'muted', align: 'center', baseline: 'top', weight: k % 4 === 0 ? 700 : 400 }));
        });
        v.legend([['gold', 'root of the chord'], ['accent', 'other notes']]);
        v.readout(() => {
          const S = solve(), last = S[S.length - 1], tD = S.reduce((a, c) => a + c.D, 0), t12 = S.reduce((a, c) => a + c.D12, 0), root = (c) => c.d[c.ch.notes.indexOf(c.ch.root)];
          return `${passes.value} pass${passes.value > 1 ? 'es' : ''} · total dissonance: adaptive ${v.fix(tD, 2)}, 12-TET ${v.fix(t12, 2)} (${v.fix((100 * (t12 - tD)) / t12, 0)}% lower) · final C is ${sc(v, last.d[0], 1)} ¢ from 12-TET (${sc(v, last.d[0] / passes.value, 1)} ¢ per pass; the pure-interval value is −21.5) · first-pass roots: ${S.slice(0, 4).map((c) => `${c.ch.n} ${sc(v, root(c), 1)}`).join(', ')} ¢`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.17
    {
      num: '7.17',
      kind: 'Concept',
      name: 'The Bohlen–Pierce scale',
      statement: String.raw`The **Bohlen–Pierce scale** divides not the octave but the **tritave**, the interval $3{:}1$ (1901.955 ¢), into 13 steps, in its equal-tempered form each a ratio $3^{1/13}$ of 146.3 ¢. It is designed for tones that have only odd harmonics (as a clarinet or any closed pipe does, 3.3): the partials of such a tone are $f, 3f, 5f, 7f,\dots$, the interval $2{:}1$ does not occur among them, and the simplest coincidences are $3{:}1$, $5{:}3$, $7{:}5$, $7{:}3$ and the chord $3{:}5{:}7$. The just version of the scale uses the ratios $1,\ \tfrac{27}{25},\ \tfrac{25}{21},\ \tfrac97,\ \tfrac75,\ \tfrac{75}{49},\ \tfrac53,\ \tfrac95,\ \tfrac{49}{25},\ \tfrac{15}{7},\ \tfrac73,\ \tfrac{63}{25},\ \tfrac{25}{9},\ 3$, built from the primes 3, 5 and 7 like the ordinary just scale from 2, 3 and 5; steps 0, 6, 10 of the equal scale approximate the basic chord $3{:}5{:}7$.`,
      idea: String.raw`Consonance of the dissonance curve (6.4) depends on the timbre (6.5): minima occur where partials of the two notes coincide. For a spectrum of odd harmonics the coincidences are at the ratios of odd numbers, such as 3, 5/3, 7/3, 7/5, 9/5 and 9/7, which lie naturally in a tritave rather than an octave; the octave itself has no coinciding partials at all (odd multiples of $f$ never equal odd multiples of $2f$). Thirteen equal steps of the tritave follow the thirteen just ratios to within about 13 ¢ (the largest deviation is at $27/25$), because $13\log_35=19.05$ and $13\log_37=23.03$ are both close to whole numbers: the primes 3, 5 and 7 are each approximated by a whole number of steps. It is the analogue, for a different timbre, of 12-TET for harmonic tones.`,
      caption: String.raw`The dissonance curve of a tone against a copy of itself over one tritave, for odd harmonics only (as a closed pipe) or for all harmonics, with the 13 equal steps of the Bohlen–Pierce scale as grey ticks and the just ratios in green; the orange dots are the curve's own minima. Notice that for odd harmonics the deep minima fall on the steps 3, 4, 6, 7, 10 and 13 (the ratios 9/7, 7/5, 5/3, 9/5, 7/3 and 3/1), and the octave has no deep valley at all; for the full harmonic series the deep minima are the octave-based ratios (2/1, 3/2, 4/3, …) and 3/1. Play the scale and the chord 3:5:7 with either timbre.`,
      deps: ['music-7.11', 'music-3.3', 'music-6.5'],
      see: ['music-6.6', 'music-6.7', 'music-7.12'],
      refs: ['Benson ch. 6'],
      tags: ['non-octave', 'tuning'],
      credit: 'Heinz Bohlen, 1972 (published 1978); Kees van Prooijen, 1978 (independently); J. R. Pierce, M. V. Mathews and L. A. Roberts, 1984 (independently)',
      scope: String.raw`Roughness model of Sethares for steady tones, 11 harmonics with amplitudes $0.88^{k-1}$ (odd ones only in the closed-pipe case), base 261.6 Hz. The thirteen just ratios above are quoted from memory of the standard list and should be checked; the dissonance minima are computed here, not quoted. Whether listeners perceive the scale as "consonant" with odd-harmonic timbres is a matter of experiment and of learning.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Bohlen%E2%80%93Pierce_scale' },
      verify: true,
      viz(v) {
        const JB = [[1, 1], [27, 25], [25, 21], [9, 7], [7, 5], [75, 49], [5, 3], [9, 5], [49, 25], [15, 7], [7, 3], [63, 25], [25, 9], [3, 1]];
        const TR = cents(3), ST = TR / 13;
        const tim = v.select('timbre', [{ value: 'odd', label: 'odd harmonics (closed pipe)' }, { value: 'all', label: 'all harmonics' }], 'odd');
        const spec = (k) => (k === 'odd' ? [1, 3, 5, 7, 9, 11].map((h) => [h, 0.88 ** (h - 1)]) : Array.from({ length: 11 }, (_, i) => [i + 1, 0.88 ** i]));
        const cv = v.stage({ x: [0, 2000], y: [0, 1.08], axes: 'box', gutter: true, height: 340, full: true, xticks: [0, 400, 800, 1200, 1600, 1902].map((x) => [x, String(x)]), yticks: [], xlabel: 'interval above the lower tone (cents)', ylabel: 'dissonance', title: 'dissonance curve of a tone with itself' });
        const rg = v.stage({ x: [-1.45, 1.45], y: [-1.4, 1.4], equal: true, axes: false, height: 340, title: 'the tritave circle' });
        const snd = v.sound();
        const cache = {};
        const curve = (k) => cache[k] || (cache[k] = (() => { const c = dissCurve(spec(k), C4, 0, 2000, 800), mn = minima(c, 0.01); let lo = Infinity, hi = -Infinity; for (const x of c.d) { lo = Math.min(lo, x); hi = Math.max(hi, x); } return { c, mn, lo, hi }; })());
        const nearest = (c) => { let b = 0; for (let i = 0; i <= 13; i++) if (Math.abs(i * ST - c) < Math.abs(b * ST - c)) b = i; return b; };
        const stepC = (i) => i * ST, justC = (i) => cents(JB[i][0] / JB[i][1]);
        const sp = () => spec(tim.value);
        v.soundButton('play the scale', (sd) => sd.samples(seqCents(Array.from({ length: 14 }, (_, i) => [i * ST]), C4, 0.5, 0.03, sp()), SR, { gain: 0.9 }));
        v.soundButton('chord 3:5:7', (sd) => sd.samples(seqCents([[0, cents(5 / 3), cents(7 / 3)]], C4, 2.2, 0, sp()), SR, { gain: 0.9 }));
        v.soundButton('major triad 4:5:6', (sd) => sd.samples(seqCents([[0, M3J, FIFTH]], C4, 2.2, 0, sp()), SR, { gain: 0.9 }));
        v.render(() => {
          const K = curve(tim.value), n = (y) => (y - K.lo) / (K.hi - K.lo) * 0.95 + 0.04;
          for (let i = 0; i <= 13; i++) { cv.vline(i * ST, { color: 'muted', alpha: 0.35, width: 1 }); }
          for (let i = 0; i < JB.length; i++) { const c = justC(i); cv.vline(c, { color: 'green', width: 1.1, dash: [3, 3], alpha: 0.9 }); }
          cv.vline(1200, { color: 'red', width: 1.4, dash: [6, 4] }); cv.text('octave 2:1', 1200, 1.04, { size: 11, color: 'red', align: 'center', plate: true });
          cv.vline(TR, { color: 'green', width: 1.6 }); cv.text('tritave 3:1', TR, 1.04, { size: 11, color: 'green', align: 'right', dx: -4, plate: true });
          cv.path(Array.from(K.c.c, (c, i) => [c, n(K.c.d[i])]), { color: 'accent', width: 2.6 });
          K.mn.forEach((m) => { cv.dot(m.c, n(m.d), { r: 5, color: 'orange' }); });
          ring(rg, 1, { tick: ST, period: TR, len: 0.06 });
          for (let i = 0; i < 13; i++) { const a = circ(i * ST, 0.82, TR); rg.text(String(i), a[0], a[1], { size: 11, color: 'muted', align: 'center', baseline: 'middle' }); }
          JB.slice(0, 13).forEach(([p, q], i) => { const a = circ(justC(i), 1, TR), l = circ(justC(i), 1.2, TR); rg.dot(a[0], a[1], { r: 4.5, color: 'green' }); rg.text(`${p}/${q}`, l[0], l[1], { size: 10.5, color: 'green', align: 'center', baseline: 'middle' }); });
          rg.text('13 steps of 3:1', 0, 0.05, { size: 13, weight: 700, align: 'center' }); rg.text(`${v.fix(ST, 2)} ¢ each`, 0, -0.14, { size: 11, color: 'muted', align: 'center' });
        });
        v.legend([['accent', 'dissonance'], ['orange', 'minima of the curve'], ['green', 'just BP ratios'], ['muted', 'equal steps']]);
        v.readout(() => {
          const K = curve(tim.value), mins = K.mn.filter((m) => m.c > 20 && m.c < 1990).map((m) => { const i = nearest(m.c); return `${v.fix(m.c, 0)} ¢ (step ${i}, ${sc(v, m.c - i * ST, 0)})`; });
          const d = (c) => { const S = spec(tim.value), A = dissAll(at(S, C4).concat(at(S, C4 * 2 ** (c / 1200)))); return A; };
          return `step ${v.fix(ST, 3)} ¢ = $3^{1/13}$, tritave ${v.fix(TR, 3)} ¢ · ${tim.value === 'odd' ? 'odd harmonics' : 'all harmonics'}: minima at ${mins.slice(0, 9).join(', ')} · dissonance at 3:5:7's intervals vs octave-based: 5/3 → ${v.fix(d(cents(5 / 3)), 2)}, 3/2 → ${v.fix(d(FIFTH), 2)}, 2/1 → ${v.fix(d(1200), 2)}, 3/1 → ${v.fix(d(TR), 2)}`;
        });
      },
    },
  ],
};
