import syllabus from './syllabus.js';
import {lessons} from './ch10.viz.js';
const prose = [
  {
    "statement": "A pulse is a sequence of approximately equally spaced temporal reference points. If the chosen pulse rate is $b$ beats per minute, its period is $T=60/b$ seconds. A tempo number is incomplete unless we say which pulse or note value it counts.",
    "idea": "For tap offsets $t_0=0<t_1<\\cdots<t_m$, consecutive intervals are $I_j=t_j-t_{j-1}$. The displayed estimate is $60000/\\operatorname{median}(I_j)$ when intervals are in milliseconds. Population standard deviation and its ratio to the mean describe variability of these intervals. One tap supplies no interval and therefore no tempo estimate. An offset from the nominal grid is a different quantity from an interval error; neither measures a device’s audio latency.",
    "scope": "The initial tap series is authored. Your taps use the browser’s event timing, rounded to milliseconds and retained in the share link. The diagram does not infer a preferred tempo, an auditory perception threshold or a clinical timing ability. Sound uses synthesized clicks requested by the listener.",
    "refs": [
      "Toussaint, A Mathematical Analysis of African, Brazilian and Cuban Clave Rhythms, printed 160: beat/pulse context; authored interval statistics"
    ],
    "source": "https://archive.bridgesmathart.org/2002/bridges2002-157.pdf",
    "caption": "Compare an equally spaced nominal pulse with authored or personally captured tap times. Read the actual intervals and their tempo estimates; clear the taps to expose the undefined one-tap and empty states."
  },
  {
    "statement": "Meter organizes a pulse at several nested temporal levels. In this declared eighth-note grid, 3/4 and 4/4 group two eighths into each quarter-note beat; 6/8 and 12/8 group three eighths into each dotted-quarter beat. A bar contains respectively three, four, two or four such beat groups.",
    "idea": "Each row marks one level. Counting the rows present at a position gives its displayed metrical weight. The eighths remain equally spaced while beat and bar levels select subsets. For 4/4 and 12/8 this schematic also includes a half-bar level. The same number of eighths can have different groupings: 3/4 and 6/8 each contain six eighths, but group them as $2+2+2$ and $3+3$.",
    "scope": "A schematic hierarchy with explicit authored accents, not an automatic meter detector or a claim that performed beats always receive loud accents. The tempo control counts eighth-note pulses; it does not silently treat a dotted-quarter beat as a quarter beat.",
    "refs": [
      "Toussaint, Clave Rhythms, section 3.3: nested metrical levels; authored simple/compound grouping schematic"
    ],
    "source": "https://archive.bridgesmathart.org/2002/bridges2002-157.pdf",
    "caption": "Switch four declared meters. Coordinate the linear group spans, metrical dot rows and circular beat positions while the same eighth-note unit remains explicit."
  },
  {
    "statement": "Represent an $n$-step repeating onset pattern by a binary word $a_0,\\ldots,a_{n-1}$ on $\\mathbb Z/n\\mathbb Z$. An onset is 1 and a rest is 0. A rhythm necklace identifies words that differ by a cyclic rotation; it does not automatically identify a word with its reversal.",
    "idea": "A rotation changes the starting position while preserving the cyclic order of inter-onset gaps. Those positive gaps sum to $n$ for a nonempty word; one onset has a single gap $n$. If the smallest repeating period is $d$, then there are $d$ distinct rotations and $n/d$ rotations that fix the word. Indeed, shifts fixing the word form a subgroup of the cyclic shift group, and its cosets give the distinct words. A canonical lexicographic representative is only a reproducible label.",
    "scope": "Finite equally spaced grids with 4–24 steps. Both the empty and full words have period 1. Empty onset gaps are undefined, rather than a zero-length interval. Hamming distance compares aligned binary words; it is not a calibrated auditory distance.",
    "refs": [
      "Toussaint, The Euclidean Algorithm Generates Traditional Musical Rhythms, section 4: necklace and cyclic gaps; Benson 2008, sections 9.1 and 9.10: symmetry context; authored finite orbit argument"
    ],
    "source": "https://cgm.cs.mcgill.ca/~godfried/publications/banff.pdf",
    "caption": "Edit onsets on a circle or with the selected-step control. Rotate the word, compare complete cyclic gaps, and see which rotations coincide exactly with the original word."
  },
  {
    "statement": "Two periodic event trains with repetition rates $pf_0$ and $qf_0$ have a rate ratio $p:q$. For coprime positive integers $p,q$, their combined event pattern repeats after $1/f_0$. Multiplying $f_0$ changes the time scale while preserving the ratio.",
    "idea": "The generated signal uses a finite Fourier pulse train. With $L=H+1$, define\n\n$$S_H(u)=\\sum_{j=0}^{H}e^{2\\pi iju}.$$\n\nThe zero-mean pulse is\n\n$$P_H(u)=\\frac{|S_H(u)|^2-L}{L^2}.$$\n\nExpanding the square gives cosine coefficient $c_h=2(L-h)/L^2$ for harmonic $h=1,\\ldots,H$: there are $L$ minus $h$ index pairs at difference $h$. The mean is zero and the positive peak is below one. A finite geometric sum gives the efficient sine quotient, with its exact limit at integer phase. In-phase components at the same frequency add; the plotted coefficients follow the actual two component lists.",
    "scope": "The audio is a ramped finite excerpt of declared harmonic pulse trains. Retained periodic harmonics stay at or below 6000 Hz and below the playback Nyquist rate; the finite excerpt has window leakage. The plotted lines are steady-state coefficients, not a recorded DFT. Rhythmic grouping, pitch salience and consonance depend on listeners and timbre; no universal 20-Hz transition is asserted.",
    "refs": [
      "Benson 2008, section 2.12, printed 63–64: periodic pulse streams and spectra; authored finite Fourier/geometric-sum derivation"
    ],
    "source": "https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf",
    "caption": "Keep an exact repetition-rate ratio while changing its scale. Compare event alignments within a common cycle and the actual Fourier components, then request a synthesized excerpt."
  },
  {
    "statement": "Bjorklund’s construction starts with $k$ one-bit onset groups and $n-k$ zero-bit rest groups. Repeatedly append one remainder group to each available formed group, retain the leftovers as the next remainder, and stop when at most one remainder group remains. Concatenate the groups to obtain the cyclic word $E(k,n)$.",
    "idea": "The displayed groups are the actual intermediate strings, not a picture drawn after a floor formula. For $n=13,k=5$ they progress through five 10 groups, then three 100 groups and two 10 groups, then two 10010 groups and one 100 group. The accompanying Euclidean divisions compute $\\gcd(n-k,k)$. The final finite certificate checks every $q$-onset span: for each $1\\le q<k$, all cyclic distances across $q$ consecutive onset intervals differ by at most one grid step. Adjacent gap sizes alone are insufficient. The bounded construction also agrees, up to rotation, with the separately computed floor-construction word.",
    "scope": "An executable construction and complete span certificate on 2–24 steps, not a proof of a general ethnomusicological classification. All-rest and all-onset inputs are explicit. The requested onset count is capped at available steps and reported. Tresillo and cinquillo labels in the source refer to its particular examples and starting positions; the adjustable pattern is not an authenticity test.",
    "refs": [
      "Toussaint, The Euclidean Algorithm Generates Traditional Musical Rhythms, sections 2–4; authored exhaustive bounded-grid span and floor-necklace checks"
    ],
    "source": "https://cgm.cs.mcgill.ca/~godfried/publications/banff.pdf",
    "caption": "Step through actual repeated groups and remainders, compare the intermediate word with the final necklace, and inspect every q-onset span spread of that final result."
  },
  {
    "statement": "On an even $n$-step cyclic grid, the rhythmic oddity test asks whether no pair of onset positions is separated by exactly $n/2$ steps. Equivalently, $a_i a_{i+n/2}=0$ for each $i=0,\\ldots,n/2-1$.",
    "idea": "The $n$ positions partition into $n/2$ diametrically opposite pairs. Checking each pair once is therefore a complete certificate: a failure is an actual diameter whose two endpoints both contain onsets. A passing word has at most $n/2$ onsets by the pigeonhole principle. Rotating the word preserves the test because it preserves a half-cycle difference. A pattern can pass while having other symmetries; visual asymmetry and this exact property are different statements.",
    "scope": "The offered 12-,16-and 24-step grids are even. The empty pattern passes vacuously. This finite test makes no claim about a pattern’s cultural provenance, popularity, performance difficulty or perceptual complexity. No unread original oddity-paper proof is claimed.",
    "refs": [
      "Authored finite antipodal-pair definition and pigeonhole proof"
    ],
    "caption": "Toggle onsets and see every actual antipodal conflict as a diameter. The paired-half-cycle table and complete pair count certify the result independently of its visual appearance."
  },
  {
    "statement": "A numerical syncopation diagnostic requires a declared meter and a declared rule. Here positions 0–7 of the 16-step hierarchy have weights $(5,1,2,1,3,1,2,1)$; positions 8–15 have weights $(4,1,2,1,3,1,2,1)$. We compare the source’s occupied-weight metric complexity with a separately defined rest-contrast diagnostic.",
    "idea": "Metricity is $M=\\sum_i a_iw_i$. For $k$ onsets, let $M_{\\max}(k)$ be the sum of the $k$ largest available weights; metric complexity is $M_{\\max}(k)-M$. Independently, for each onset $i$, examine only the silent positions before the next onset cyclically. Let $u_i$ be their largest weight, or zero if there are none. Our rest contrast is $\\sum_{i:a_i=1}\\max(0,u_i-w_i)$; each onset contributes once. These definitions answer different questions. For the source’s Son positions 0,3,6,10,12, metricity is 13 and the maximum is 17, so metric complexity is 4. The authored cluster at positions 8–15 has metricity 15 of 23, so metric complexity 8, while its rest contrast is 4.",
    "scope": "An onset-only finite comparison with one fixed hierarchy. Rest contrast is an authored rule, not the complete Longuet-Higgins–Lee or Pressing measure. Neither score is a universal scale of felt syncopation. Rotating the onset necklace against a fixed bar can change either score, even though its cyclic gaps remain unchanged.",
    "refs": [
      "Toussaint, Clave Rhythms, section 3.3, printed 162–163: metrical weights, metricity and metric complexity; authored rest-contrast definition"
    ],
    "source": "https://archive.bridgesmathart.org/2002/bridges2002-157.pdf",
    "caption": "Edit the onset word against a fixed metrical grid. Expose each positive weak-onset/stronger-rest contribution and compare both declared scores across all 16 rotations."
  },
  {
    "statement": "A nominal swing ratio $r:1$ divides a beat of duration $T$ into long and short intervals $\\frac{rT}{r+1}$ and $\\frac{T}{r+1}$. Straight eighths have $r=1$; a 2:1 division places the offbeat two thirds through the beat. Microtiming is a separate change to individual onset times.",
    "idea": "The diagram starts from a straight grid, moves each offbeat to its nominal swing position, and then adds a deterministic offset $\\delta_j$. The actual onset is $t_j=t_j^{\\mathrm{swing}}+\\delta_j$, so its total displacement from straight time contains both effects. Moving adjacent onsets changes their interval by $\\delta_{j+1}-\\delta_j$, which explains why the measured long/short ratios differ from the nominal ratio. Over the offered tempo and offset ranges, the shortest nominal interval is at least 62.5 ms and adjacent offset differences are at most 40 ms, so order remains strict.",
    "scope": "Eight authored onsets over four beats. The first onset stays at zero; other offsets lie within the selected±20-ms range. The recipe is deterministic and shareable, not sampled performance data. No universal jazz swing ratio, optimal jitter, or groove preference is inferred.",
    "refs": [
      "Authored beat-division, onset-offset and interval-order derivations"
    ],
    "caption": "Coordinate straight, swung and actual onset timelines with total offsets and separately measured long/short ratios. Hear the same declared times in a requested generated excerpt."
  },
  {
    "statement": "For a finite real onset-strength array $x_0,\\ldots,x_{N-1}$, extend it by zero and define positive-lag autocorrelation $R(\\ell)=\\sum_{j=0}^{N-1-\\ell}x_jx_{j+\\ell}$. A candidate lag at sample rate $F_s$ corresponds to $60 F_s/\\ell$ beats per minute.",
    "idea": "The calculation uses the same zero-lag energy $R(0)$ to normalize every lag. It does not divide by the shrinking number of overlapping samples. For a repeated pulse pattern, lags near a repetition interval align many positive entries, but the finite window reduces overlaps at longer lags. Subdivision peaks can compete with the intended beat interval; missing beats can strengthen longer intervals. The tracker chooses the largest local peak inside the declared 40–240-bpm search interval, preferring the longer lag for an exact tie. The plotted grid uses that actual selected lag.",
    "scope": "A six-second authored, quantized onset signal at 100 Hz, not a supplied drum recording, audio onset extractor or complete beat-tracking pipeline. The finite-array sum is distinguished from the continuous convolution in the prerequisite. Lag quantization and the search interval limit tempo estimates; the declared source tempo is retained as a comparison, not used to force the answer.",
    "refs": [
      "Authored zero-extended finite-array autocorrelation, search rule and synthetic examples; rca-8.13 for the distinct continuous-convolution context"
    ],
    "caption": "Compare an authored onset-strength signal with its complete positive-lag autocorrelation. Expose actual candidate peaks and place the selected click grid beside the declared quarter-note grid, including subdivision and missing-beat cases."
  },
  {
    "statement": "An additive grouping specifies successive cell lengths over an equal underlying pulse, such as $2+2+3$. The cells determine accent positions by cumulative sums. A grouping of two- and three-unit cells has unequal higher-level spans even while its smallest pulse stays constant.",
    "idea": "For cell lengths $g_0,\\ldots,g_{k-1}$ with sum $n$, the onset positions are $0,g_0,g_0+g_1,\\ldots$. Compare this word with every rotation of $E(k,n)$ rather than assume that any mixture of two and three is Euclidean. The grouping 2+2+3 matches the E(3,7) necklace. The authored 2+2+3+3 counterexample does not: its two-onset spans can be 4,5 or 6, so their spread is 2. The full q-span view exposes that failure.",
    "scope": "Explicit mathematical examples of additive organization. The term aksak has a musical and cultural context broader than an arbitrary binary word; this visualization does not classify traditions or transcribe a performance. Source cultural examples remain source attributions, while the extra counterexample is authored.",
    "refs": [
      "Toussaint, Euclidean Algorithm, section 4: E(3,7), E(4,9) and additive interval examples; authored cumulative-sum and q-span comparisons"
    ],
    "source": "https://cgm.cs.mcgill.ca/~godfried/publications/banff.pdf",
    "caption": "See actual short and long cells, their circular onset pattern, and all q-onset span ranges. Compare an additive grouping with its Euclidean reference, including a grouping that fails maximal evenness."
  },
  {
    "statement": "Two copies of a cyclic word running at step-pulse tempi $b$ and $b+\\Delta b$ accumulate relative phase $\\Delta b\\,t/60$ in grid-step units after $t$ seconds. The unwrapped phase grows linearly; its residue modulo the cycle length describes their relative orientation.",
    "idea": "If the word’s smallest repeating period is $d$ steps, the first positive relative-phase realignment occurs after $60 d/|\\Delta b|$ seconds when $\\Delta b\\ne 0$. It need not wait for an entire $n$-step drift. For example, E(4,12) repeats every 3 steps and realigns four times per full-grid drift. A negative tempo difference reverses the motion. With zero difference the words remain aligned at every time, so there is no finite drifting period to report. Alignment is a property of the whole word; isolated coincident onsets can occur without full alignment.",
    "scope": "An authored phase process using stated word patterns and constant tempi. The display resolves elapsed time to one millisecond, with integer timing arithmetic for exact grid alignments. It is not a playback or analysis of a named composer’s recording, and two equal-tempo copies are not treated as drifting.",
    "refs": [
      "Benson 2008, section 1.8, printed 18–19: phase/beat algebra context; authored cyclic-word period and realignment proof"
    ],
    "source": "https://homepages.abdn.ac.uk/d.j.benson/pages/html/music.pdf",
    "caption": "Coordinate relative onset positions, concentric phase cycles and an unwrapped time trace. Compare primitive and repeating words, reverse or remove the tempo difference, and check the actual first realignment."
  },
  {
    "statement": "Hypermeter groups whole measures into a higher-level hierarchy. In this schematic, a sixteen-bar source has nested 2-,4-or 8-bar levels. Source structural accents remain attached to source bars, while a second count assigns strong positions by the current bar number.",
    "idea": "Before an edit, source index $s$ and new position $p$ agree. Inserting one bar makes $s-p=-1$ after the inserted position; deleting one makes it $+1$ after the deletion. Reducing this displacement modulo the chosen hypermeasure length shows the counting phase. An inserted bar has no original source index, so its source phase is undefined. The two accent maps can therefore disagree while the source accents of surviving bars remain fixed. This calculation illustrates a possible analytical distinction; it does not decide how a listener must regroup a phrase.",
    "scope": "An authored bar-and-accent schematic without a transcribed melody or perceptual dataset. Audio gives each displayed bar half a second to expose the accent sequence. An undefined inserted source phase is shown as a gap, not silently interpolated through the insertion.",
    "refs": [
      "Authored hierarchical bar schematic and exact insertion/deletion index argument"
    ],
    "caption": "Insert or delete a chosen source bar. Compare the current position hierarchy with retained source accents, and inspect the resulting modular displacement with an explicit gap for an inserted bar."
  },
  {
    "statement": "A six-quarter-note span can contain two bars of 3/4 or one bar of 3/2. The first organization has two bar-sized groups of three quarters; the second has three half-note beat groups of two quarters. Their higher grouping is $3+3$ versus $2+2+2$ over the same span.",
    "idea": "Let a quarter last $T$ seconds. The common span is $6 T$; its two displayed group rates are $2/(6 T)$ and $3/(6 T)$, in the ratio 2:3. Their completed-group counts reach 2 and 3 at the same endpoint. All six underlying quarter-note positions remain unchanged. Switching which accents sound therefore changes the higher organization of this authored example, without mathematically changing the quarter-note tempo.",
    "scope": "A declared six-quarter regrouping illustrating hemiola. It does not equate the notation or every musical interpretation of the meters, infer tempo from a recording, or assert that every 3:2 polyrhythm is a hemiola. The selected accents and their inactive comparison remain explicitly visible.",
    "refs": [
      "Authored common-span, grouping and rate derivation"
    ],
    "caption": "Keep six quarter-note positions fixed while comparing two 3/4 bars with three half-note groups in 3/2. Coordinate the linear accents, circular group positions and completed-group counts, then listen to either accent frame or both."
  }
];
const frozen = syllabus.chapters.find(c => c.n === 10);
export default {
  collection: 'music', chapter: 10, title: frozen.title,
  summary: 'Explicit pulses, nested meters and editable cyclic words connect timing to symmetry. Declared finite calculations expose evenness, antipodal conflicts, metrical scores, swing offsets and tempo ambiguity. Generated sound and coordinated diagrams retain the same stated timing laws.',
  items: frozen.items.map((item,i) => {
    const {pic, ...metadata} = item; const {source, ...body} = prose[i];
    return {...structuredClone(metadata), ...body, ...(source ? {links:{source}} : {}), viz: lessons[i+1]};
  })
};
