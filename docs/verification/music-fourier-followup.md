# Music8.14/8.15: Fourier phases, exact maxima and interval content

Candidate addresses exactly the two existing queue IDs **music-8.14** and **music-8.15**. Both flags remain `verify:true` for independent acceptance. No additional ID, central ledger, shared runtime/helper or generated data is changed. Objects8.9–8.13 are preserved verbatim;8.14 adds a unique helper import and namespaced local rendering helpers above the existing chapter. The coordinator owns integration of those imports with its set-class batch.

## Actual primary access and reading

Emmanuel Amiot, [Gammes bien réparties et transformée de Fourier discrète](https://journals.openedition.org/msh/pdf/4272), Mathématiques et sciences humaines178(2007), publisher metadata95–118, DOI[10.4000/msh.4272](https://doi.org/10.4000/msh.4272). The [publisher article page](https://journals.openedition.org/msh/4272) links the complete24-page PDF including cover. Local `/tmp/atlas-worker-one/amiot-msh-2007.pdf`,1,290,351bytes,SHA256 `68c0a2cac5ccd4ecd0d73f01e0c53545c973367d5466e08d952da3567fced12e`.

Actually read the mathematical exposition in French: §§1.2–1.4, printed99–102/PDF6–9, with the transform convention/inverse, T/I behavior, nonzero complement coefficients, interval-content Theorem3/convolution proof, and the **equal-cardinality** condition of hexachord Theorem4. Also read the maximization definition and generated/floor classification discussion in§§2.1–2.2, printed103–109/PDF10–16. Actual source pixels inspected forPDF6/7/8/9 after extracting text; images `/tmp/atlas-worker-one/amiot-pages/page-N.png`. The complement theorem's nearby introductory index typo is disambiguated by its explicit displayed range1…c−1. No original Lewin1959, Quinn2006/2007, Tymoczko book or Amiot JMM paper is claimed read. The JMM publisher URL returned403; this complete primary paper supplies the claims actually used.

8.14 uses the source's negative-exponential convention and magnitude/phase distinction.8.15 uses its ordered autocorrelation identity and inverse, with the correct hexachord condition. The finite enumeration and exact-arithmetic implementation are independently derived, rather than treating source attribution or a brute-force floating tolerance as proof.

## Material conditions and widget corrections

The old8.14 text said only six magnitudes matter without distinguishing this summary from the complex transform. It now states that phase is discarded and distinct sets can share magnitudes. A large bin measures phasor alignment, not a unique musical category. The original tip-to-tail code sorted the moved set again after wrapping; that changed the chain order, so the plotted chain did not simply rotate as the caption claimed. The repaired chain maps the original base-note order under T/I. Its endpoint equals the actual complex coefficient. Editing the displayed clock correctly applies the inverse active T/I map to the base set, and sound plays the displayed transformed pitch classes. The opaque edited bitmask is now serialized through a strict self-contained state adapter.

The old8.15 statement applied same interval-vector/all-magnitude conclusions to arbitrary complements. Correctly, all **nonzero** Fourier bins agree for complements, while bin0 records sizesm and12−m. The full ordered interval function differs by the constant12−2m, including difference0. Equality occurs for complementary hexachords. Equality of six-entry interval vectors is equivalent to equality of every magnitude for **equal-cardinality** sets; the empty set/singleton corner defeats an unconditional statement. The repaired power plot includes bin0, exposes unequal sizes, and labels absent Z-mates rather than plotting A as a fake comparison. The exact inverse reconstructs all twelve counts; a separate floating inverse has its actual error reported. The clock edit and opaque custom state replay preserve the same set used for every plot and audio action.

## Exact arithmetic and independent exhaustive evidence

For twelve classes,2cos(2πj/12) has integer coefficients in1 and√3. Thus every squared coefficient is an exact pair(a,b) representinga+b√3. The production helper derives these from unordered note pairs. Comparisons use integer/BigInt signs and squared magnitudes, preserving all ties without an epsilon. Inverse counts are evaluated in the same quadratic field: multiplying by the doubled-cosine table and dividing by24 produces exact integers, not rounded negative floating residues. Parseval's full-bin sum is exactly(12m,0).

The independent Python oracle uses a different construction: circular-bitset **intersection** counts for every ordered difference; then a DFT in the cyclotomic ringZ[z]/(z^4−z²+1), reducing powers ofz with exact integer polynomial arithmetic. It independently compares values using a certified90-digit rational enclosure of√3, with integer-square verification of both enclosure endpoints. Generic-interval maximal evenness in production is compared against an independently built floor/transposition inventory. Z-mates are separately grouped by size/vector and bit-rotation/reflection class. Sixteen selected complex values and audio registers are also evaluated at90-digit precision.

Every one of the4,096 records has a canonical transcript row(mask,size,ordered counts,interval vector,all twelve exact powers). Both implementations produce SHA256 `94e4f6390c95bc4a8acd774e07d4a4dea9812a2d18868fc65f7225b5d3eb45e2`. `music-fourier-reference.json` records this digest, every cardinality/bin maximum and complete winner list, all Z-mate results and selected complex/register fixtures. The Python generator imports no JavaScript.

The finite maximally-even check succeeds for every set of cardinality2…10. The selected bins/maximal squared powers/winner counts are:

|Size|Bin|Exact maximum squared magnitude|Number of attaining sets|
|---:|---:|---:|---:|
|2|2|4|6|
|3|3|9|4|
|4|4|16|3|
|5|5|7+4√3|12|
|6|6|36|2|
|7|5|7+4√3|12|
|8|4|16|3|
|9|3|9|4|
|10|2|4|6|

This is an exact finite check forZ/12, not a claimed implementation/proof for all cyclic groups.

## Validation and audio contract

- `python3 tests/verification-music-fourier-reference.py`: all4,096 exact records/maxima/ties/ME inventories/Z-mates and16high-precision complex/register fixtures, `/tmp/atlas-worker-one/fourier-reference.log`.
- `node --test tests/verification-music-fourier.test.mjs`: six groups pass. Every source-model row is matched by the independent transcript; trigonometric DFTs check the complex values and squared magnitudes; every maximum/tie and generic interval criterion is checked; all24 T/I operations for every set preserve exact powers; preset phasor chains rotate/reflect with fixed ordering; every complement, Z-mate and zero/one-cardinality caveat is checked. Audio tests cover every preset/comparison, full12-voice chords, empty-event silence, actual transformed registers, ramps/gaps/bounds and malformed domains. `/tmp/atlas-worker-one/fourier-math.log`.

The declared additive sound is C4=261.6256Hz with eight harmonics1/h per note, all below Nyquist, mono44,100Hz,0.6-second events,10-ms ramps, normalization by amplitude sum and voice count, pre-output bound0.12. Comparison events have0.1-second gaps; an empty event is an explicit zero signal. Voice gain1/normalization disabled feed the existing master0.9/limiter. Audio never autoplays or runs during state restore. Both widgets expose Stop. An empty8.14 set disables playback;8.15 disables comparison audio only when B is absent. No subjective equivalence is inferred from matching magnitudes or vectors.

Final native and strict-build evidence follows below. Flags remain for peer acceptance.

Final static check `node scripts/check.mjs music-8.14 music-8.15 --static` passes two items,zero errors/warnings; `/tmp/atlas-worker-one/fourier-static.log`. Final strict scratch build passes6,684items/450chapters/85collections,zero errors/warnings; `/tmp/atlas-worker-one/fourier-build.log`, with generated output confined to `/tmp/atlas-worker-one/fourier-build`. Exact text guards confirm all protected8.9–8.13 objects, all8.16+ objects and every other syllabus row remain unchanged. `git diff --check` passes.

Final native `node tests/verification-music-fourier.mjs` passes six groups per item at1450/430/320px, light/dark; separate logs `fourier-native-dft.log` and `fourier-native-interval.log` under `/tmp/atlas-worker-one`, both exit0. Total198realbuffers/324events are checked sample by sample against an independently ordered H8 sum, including full12-note chords and explicit silent events. Rate/channels, every gap sample, peak, actual transformed pitches, voice/master/limiter routing and Stop calls are asserted. All presets, Fourier bins, selected transpositions/inversions, keyboard controls, real clock edits under active T/I, exact custom-mask reload, malformed fallback and absence of autoplay are exercised. The tests independently check all rendered coefficients/counts/inverse rings/phasor arrows, full geometry/marker/text bounds and TeX/page overflow. Checkbox inversion is exercised by its native keyboard interaction, since the styled switch track intentionally covers the underlying input hit area. Narrow peer command: `node tests/verification-music-fourier.mjs dark 320`.

Fresh pixels actually inspected include `music-fourier-8.14-initial-panel2-320-dark.png` (phasor chain/result), `music-fourier-8.14-empty-panel1-320-dark.png` (finite zero magnitudes/maxima), `music-fourier-8.15-initial-panel1-320-dark.png` (all ordered counts/exact inverse rings), `music-fourier-8.15-initial-panel2-320-dark.png` (unequal complement sizes in bin0), `music-fourier-8.15-empty-panel1-320-light.png` (zero versus full complement) and final `music-fourier-8.15-edited-panel2-320-dark.png` (saved moved-copy comparison). All are under `/tmp/atlas-worker-one`; additional panels/full pages follow `music-fourier-ITEM-STATE[-panelN]-WIDTH-THEME.png`. Both existing verification flags remain for independent review.

## Independent coordinator acceptance, 2026-10-20

Reviewed exact candidate `f58056a484dc292e09ef9a9da8356c2062c80741` in `/tmp/atlas-coordinator/music-fourier-peer`. Read the actual Amiot 2007 primary paper, especially printed99–107 and the classification discussion through108–109, and inspected actual source page pixels. Independently regenerated the cyclotomic/bit-intersection reference for all4,096 sets using 90-digit arithmetic; its byte-identical digest is `94e4f6390c95bc4a8acd774e07d4a4dea9812a2d18868fc65f7225b5d3eb45e2`. Six mathematical groups, focused static (two items, zero errors/warnings) and four fresh320px light/dark native runs pass. Actual66 audio buffers/108 events, individual samples, routing, Stop, replay, malformed state and all output geometry were checked; personally inspected six own output screenshots. Evidence logs `/tmp/atlas-coordinator/music-fourier-peer-{math,reference,static,native}.log` and images `music-fourier-peer-images/`.

Integration `860a712` resolves only chapter/syllabus placement: byte guards preserve all prior set-class items/imports and every unrelated syllabus row. A merged-root native check also passes both items with no failures, TeX blanks or quality issues (`music-fourier-merged-native.log`). Removed 2007 only from both credit fields, because that metadata is interpreted as an idea date; the references retain the publication date. Worker one explicitly agreed to this metadata correction. Both flags may close for the source-supported identities and exact finite models; the equal-cardinality and nonzero-bin qualifications remain explicit.
