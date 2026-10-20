# ALGO 5.18: concrete expectation, bounded construction and replay

This is a separate runtime candidate after immutable prerequisite commit `50424bfe669f06c70eb4a14b5948fe60a0989395`. Independent acceptance is pending. Source flags are unchanged; no source closure, global inventory or shared-runtime change is claimed.

## Corrected behavior

The former live legend/readout treated `2n-1` as the exact mean first-level space for its concrete affine family. Universality proves an upper bound, while this family's exact expectation can be strictly smaller. Its first-level loop also stopped after more than fifty unsuccessful attempts and then continued building as if the space criterion had passed; second-level retries were unbounded. Random keys and regenerated functions were not covered by an opaque state adapter.

The item now lives in private `perfect-hashing-item.js`, backed by `perfect-hashing-audit.shared.js`. The chapter imports that item. Nine unowned chapter objects remain identical, all other pre-existing ALGO files are byte-identical, and the owned item's statement, dependencies, reference metadata and source flags remain identical. Its idea's opening collision expectation now explicitly says **at most**, removing the equality-like wording alongside the new caption, explicit scope and visualization. This narrow prose correction follows independent peer review of the initial runtime candidate.

The family is still `((a*x+b) mod p) mod m`, with prime `p=1000003`, nonzero `a`, and the same distinct integer-key range 10–99. For distinct keys the ordered pair of residues before the final modulus is uniform among the `p(p-1)` ordered distinct pairs. If residue class j modulo m contains t_j representatives, the collision probability is

`sum_j t_j(t_j-1) / (p(p-1))`.

Consequently expected first-level space is `n+n(n-1)*collisionProbability`, whereas the universal upper bound is `2n-1`. The helper counts classes of size floor(p/m) or ceil(p/m). The histogram, sample mean, exact expectation and upper bound now have separate labels; the readout prints enough digits to distinguish them. For default n=12 the exact expectation is approximately **22.999879**, the upper bound is **23**, and the 3000-draw sample mean is an independently identified estimate. Sample retry fractions have no automatic inequality/checkmark. Rejection sampling of the 32-bit RNG outputs avoids a floor-to-integer parameter bias.

Both construction levels have an explicit **51-attempt** budget. First-level exhaustion returns blocked rows and no usable table. If any second-level bucket exhausts its collision-free search, the entire construction remains uncertified, including its successful buckets. Lookup is disabled unless the space criterion and every bucket collision test pass. No collision silently overwrites a key to create an apparently perfect table.

The real mode control includes deliberate repeated choices of admissible family members: a bad first-level draw, and a bad bucket draw. The UI explicitly says these repeated choices break the independent-draw hypothesis; failure is an unfinished bounded construction, not a refutation of the theorem. With keys `[10,16,11,12,13,14]`, repeated first-level draws put all six keys into one bucket (space36≥24, 51 attempts). In bucket mode the first draw has space8<24, but the bucket containing10 and16 exhausts51 colliding attempts. Both are actual construction branches, and both disable lookup.

## State and native verification

Opaque state stores the exact key list, key-generation seed, attempt seed and selected lookup; core state stores key count and mode. Restores validate dense, distinct, bounded integer keys, integer32-bit seeds and membership of the selected key. Count mismatch or a lookup on an unfinished construction fails at setter time and resets the complete state. Stored hash tables are recomputed and verified, never trusted from a serialized assertion.

`node --test tests/verification-algo-perfect-hashing.test.mjs`: **6 groups pass**. These include exhaustive ordered-residue/family collision expectations for small primes, exact concrete space expectations strictly below the universal bound, real random-branch forced first-level exhaustion, real random-branch forced bucket exhaustion, repeated-choice modes,120 seeded successful constructions with independent BigInt modular-hash/partition/lookup invariants, malformed/sparse inputs, and an actual rejection-sampling-tail case. The random-branch tests force real admissible parameter streams, not a synthetic failure flag.

`node tests/verification-algo-perfect-hashing.mjs`: all **6** width/theme combinations (1450/430/320, light/dark) pass. Each checks:

- Actual model against independent BigInt modular hashes, row membership, space, collision status and lookup result; no returned table is accepted only because its own boolean says so.
- Exact concrete-family expectation from an independently summed list of residue-class lengths, both plotted theoretical markers and the displayed readout; sampled quantities are separately identified.
- Actual numeric DOM key count equals model/saved count; actual pressed selector agrees with the saved/model mode.
- Real Home/End/arrows/pointer changes, redraw/new-key buttons, button lookup and pointer lookup into an occupied slot.
- Complete edited replay with exact state, complete constructed tables, draw counts, controls, readout and drawn rectangles/markers.
- Actual first-level and bucket-level51-attempt exhaustion reached by complete raw tuples, plus real mode switches, with disabled lookup and fresh output.
- Eleven malformed whole-state fallbacks per combination (**66 total**), including sparse/duplicate/out-of-range keys, bad seeds, key-count mismatch and a lookup on an unfinished build.
- No runtime/TeX/blank-stage errors or horizontal overflow, with finite drawn rectangles contained in their declared stages.

Instrumentation wraps the actual browser helper export to observe its returned object; it does not replace the construction algorithm. The independent tests check those values against separate integer/hash/count oracles. The producer personally inspected all **18** new default/first-exhausted/bucket-exhausted screenshots across the six combinations: slot rows, failure labels, disabled controls, histogram markers and readouts are legible in both themes.

Evidence: `/tmp/atlas-new-imaging-source/perfect-math.log`, `perfect-native.log`, `perfect-native/` and immutable pre-edit `perfect-baseline/`. Set `ALGO_PERFECT_OUTPUT` to a fresh peer directory when rerunning the native probe.

Focused static: **1 item, 0 errors, 0 warnings**. Strict build: **6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors, 0 warnings**, home **112702 bytes gzip** (`perfect-build.log`). `git diff --check` passes. The coordinator owns the new integrated full checkpoint and state-followup acceptance; this candidate makes neither claim.
