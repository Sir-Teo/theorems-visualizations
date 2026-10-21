import{setClassViz,setBurnsideViz,setVectorViz,setHexViz,setZViz}from'./setclass-viz.js';
const source='https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf';
const audio=String.raw`Playback is an authored mono 44,100-Hz signal: C4 = 261.6256 Hz, pitch class j has frequency C4×2^(j/12), and eight harmonics have amplitudes proportional to 1/h. Ten-ms endpoint ramps and normalization bound the synthesized samples by 0.12 before the runtime output chain. Empty events are silence. No measured auditory equivalence, difference or historical priority is inferred.`;
export default[
 {
  num:'8.9',kind:'Definition',name:'Set classes and prime form',
  statement:String.raw`Let a pitch-class set be a subset of $\Z/12$. The 24 maps $T_n(x)=x+n$ and $I_n(x)=n-x$ act on these subsets. A transposition/inversion class is an orbit of that action.

For a definite representative convention, sort every image increasingly and choose the smallest tuple in the order (first, last, second, third, …, next-to-last). For a nonempty set its first entry is 0; the empty set represents itself. This is the explicit convention described in Benson §9.14. It selects one representative of each orbit, including symmetric sets with fewer than 24 distinct images.`,
  idea:String.raw`Applying another group operation permutes the list of all images, so choosing a minimum from that list gives the same representative throughout a class. Conversely, two sets with the same representative belong to the same orbit: compose one witnessing operation with the inverse of the other. Operations carrying a set to a fixed image form a coset of its stabilizer, giving (number of images)×(number of stabilizers)=24.

The chosen representative is a naming convention; it does not order musical quality. A normal ordering of the original pitch classes changes under transposition. The normalized representative is invariant, rather than the original ordered list itself.`,
  caption:String.raw`Edit the left clock by clicking actual visible note positions, or use a set button. The second clock shows the canonical representative and the readout gives a witnessing operation. The responsive grid contains every distinct class member; click a small clock to choose it. Playback visits those actual members in increasing bit-mask order.`,
  deps:['music-8.7'],see:['music-8.10','music-8.11'],refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §9.14, pp. 332–334; explicit representative convention'],tags:['set theory','group action'],
  credit:'Technical exposition: Dave Benson, §9.14; exact finite enumeration and synthesis authored here.',
  scope:String.raw`The domain is all 4096 subsets of the twelve equal-tempered pitch classes. The tuple rule is stated explicitly, without claiming agreement with every larger-set Forte/Rahn catalogue convention or authenticating their original publications. Pitch sets discard octave register, ordering and repeated notes; the displayed audio supplies a particular register. `+audio,
  links:{source},verify:false,viz:setClassViz,
 },
 {
  num:'8.10',kind:'Theorem',name:'Counting set classes (Burnside)',
  statement:String.raw`For a finite group $G$ acting on a finite set $X$, Burnside's formula counts orbits by
$$|X/G|=\frac 1{|G|}\sum_{g\in G}|\operatorname{Fix}(g)|.$$
Applied to subsets of $\Z/12$, it gives 352 classes under the 12 transpositions and 224 classes under the 24 transpositions/inversions, including the empty and full subsets.

By subset size 0 through 12, the transposition counts are 1,1,6,19,43,66,80,66,43,19,6,1,1. With inversion included they are 1,1,6,12,29,38,50,38,29,12,6,1,1.`,
  idea:String.raw`Count pairs (g,S) satisfying gS=S. Summing by operation gives the fixed-point sum. Summing by orbit gives exactly |G| per orbit, because each set has |G| divided by its orbit size as stabilizers (rep-3.15).

A subset is fixed by a permutation exactly when it is a union of its disjoint cycles. If their lengths are l₁,…,lᵣ, the coefficient of t^k in the product ∏(1+t^lⱼ) counts fixed k-subsets. A transposition T_n has gcd(n,12) cycles of length 12/gcd(n,12). Inversion I_n has two fixed positions and five 2-cycles when n is even, or six 2-cycles when n is odd.`,
  caption:String.raw`Choose a cardinality and equivalence group. The full table gives all 24 exact fixed-subset counts and permutation cycle types; muted rows are excluded from the transposition-only average. The chart gives directly enumerated orbit counts for every size. Identity counts are displayed in full, including 924 at size 6.`,
  deps:['music-8.9','rep-3.15'],see:['music-8.8'],refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §9.13, Lemma 9.13.1 and proof, pp. 330–331; §9.14 fixed-set/orbit tables, p. 333'],tags:['burnside','counting'],
  credit:'Burnside formula and technical tables: Benson, §§9.13–9.14; direct subset/cycle calculations authored here.',
  scope:String.raw`Exact finite counts for subsets, rather than ordered tone rows. Both groups, all 13 cardinalities and all 4096 subsets are enumerated. The proof concerns the stated action; no original 1897 priority or other historical publication has been authenticated here. A chart is a count visualization, not a perceptual classification.`,
  links:{source},verify:false,viz:setBurnsideViz,
 },
 {
  num:'8.11',kind:'Concept',name:'The interval vector',
  statement:String.raw`For a subset S of the twelve pitch classes, its interval vector (v₁,…,v₆) counts unordered distinct pairs with shorter-arc interval class 1 through 6. For k notes, the entries sum to k(k−1)/2. Every transposition and inversion preserves the vector.

The major triad {0,4,7} has vector (0,0,1,1,1,0); the diatonic set {0,2,4,5,7,9,11} has (2,5,4,3,6,1); the whole-tone set {0,2,4,6,8,10} has (0,6,0,6,0,3). A vector is an invariant, rather than a complete description of the set class.`,
  idea:String.raw`Every unordered pair belongs to exactly one of the six interval classes. Transposition preserves its difference and inversion reverses its sign; taking the shorter circular distance removes that sign. Thus each operation gives a bijection preserving all six pair counts. Different global configurations can still give the same counts, as 8.13 demonstrates.`,
  caption:String.raw`Click visible clock positions or choose a set. Every unordered pair is drawn in its interval-class color. Move or invert the orange copy: its six hollow markers remain at the vector values. Empty, singleton and full sets are supported, including vector entries at zero.`,
  deps:['music-8.2','music-8.9'],see:['music-8.12','music-8.13'],refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §9.14, p. 334; examples computed here'],tags:['interval vector','invariance'],
  credit:'Technical interval-vector exposition: Benson, §9.14; examples and synthesis authored here.',
  scope:String.raw`Each unordered pair is counted once, including an antipodal pair in v₆. This differs from an ordered difference/autocorrelation count, in which an antipodal pair occurs twice. No invariant is described as a listener model or as sufficient to identify an orbit. `+audio,
  links:{source},verify:false,viz:setVectorViz,
 },
 {
  num:'8.12',kind:'Theorem',name:'The hexachord theorem',
  statement:String.raw`For a k-note subset S of Z/12 and its complement, the interval-vector difference is 12−2k in classes 1 through 5 and 6−k in class 6. In particular, complementary six-note sets have identical interval vectors. They may belong to different transposition/inversion classes.`,
  idea:String.raw`For a nonzero offset d, let N_d count positions a with both a and a+d in S. Inclusion–exclusion applied to S and S−d shows that the corresponding count for the complement is 12−2k+N_d. For d=1,…,5, N_d equals the unordered interval-class count. For d=6, it is twice that count, so the correction is halved. At k=6 all six corrections vanish.

On a c-position circle the same argument gives c−2k for shorter intervals below c/2; if c is even, the antipodal correction is c/2−k. The half-circle case must be treated separately.`,
  caption:String.raw`Edit a set or generate a finite seeded subset. Its complement appears inside the same clock, and the chart compares both vectors. The readout computes all six differences and the formula's predicted shifts. Compare the two actual octave voicings, including silent empty events.`,
  deps:['music-8.11'],see:['music-8.15','music-8.13'],refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §9.14, pp. 334–336; general complement identity derived here'],tags:['interval vector','complement'],
  credit:'Technical complement-vector exposition: Benson, §9.14; inclusion–exclusion proof and finite implementation authored here.',
  scope:String.raw`All 4096 subsets are included. Independent enumeration checks the general identity and all 924 six-note cases. The seed controls a declared deterministic generator, without claiming ideal iid sampling. Original Babbitt/Lewin/Fox priority and dates are outside the present technical claim. `+audio,
  links:{source},verify:false,viz:setHexViz,
 },
 {
  num:'8.13',kind:'Concept',name:'Z-related sets',
  statement:String.raw`Two equal-cardinality pitch-class sets are Z-related when their interval vectors agree but no transposition or inversion carries one to the other. The four-note sets {0,1,4,6} and {0,1,3,7} both have vector (1,1,1,1,1,1) and lie in different classes; Benson's table labels them 4-Z15 and 4-Z29.

For subsets of Z/12 there are 23 unordered Z-related pairs of classes: 1 at size 4, 3 at 5, 15 at 6, 3 at 7 and 1 at 8. Each of the 15 six-note pairs consists of complementary classes. This is a finite classification for the stated domain.`,
  idea:String.raw`Enumerate every orbit and group its representative by cardinality and interval vector. Distinct representatives in one such group give precisely the Z-related pairs. To verify that a candidate pair is inequivalent, test all 24 operations and count their overlaps with the other set; equivalence would require an overlap equal to the cardinality. Complementation preserves vectors at size 6, and direct complete enumeration checks that the 15 colliding pairs there are exactly the inequivalent complementary classes.`,
  caption:String.raw`Choose any of the 23 pairs, then transpose or invert A. Its vector agrees with B's, while the complete lower chart gives every operation's overlap. The gold bar marks the selected operation, and the green line is the full-match threshold that none reaches. Playback compares the two declared octave voicings.`,
  deps:['music-8.11','music-8.9'],see:['music-8.12','music-8.15'],refs:['Benson, Music: A Mathematical Offering, Web version 14 Dec 2008, §9.14, pp. 334–336, tetrachord examples and complete hexachord complement list; all-domain pair counts computed here'],tags:['interval vector','counterexample'],
  credit:'Technical Z-relation examples and complementary-class list: Benson, §9.14; complete finite classification authored here.',
  scope:String.raw`The equivalence group includes both transposition and inversion, and both sets have equal size. Other groups or circle sizes can change the classification. The construction supports a finite mathematical distinction, without authenticating original nomenclature/priority or inferring a perceived sound difference.`+audio,
  links:{source},verify:false,viz:setZViz,
 },
];
