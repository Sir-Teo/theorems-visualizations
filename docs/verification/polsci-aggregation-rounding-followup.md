# POLSCI5.8: exact offered-share half ties

Runtime follow-up to the independently accepted authored aggregation model. Candidate marks5.8`verify:true` until the separate correction passes peer review. Original source/version/access claims, the written probability proof, prerequisite links and all other flags/items remain unchanged. The preceding edge-only candidate is independently reviewable at `a27e698`.

## Defect and bounded correction

An independent exhaustive consequence check found six valid native settings where multiplying the displayed thousandth share by odd N puts a positive half tie just below its mathematical value. The old `Math.round(f*N)` returned one informed voter too few:

| N | Requested share | Previous F | Correct F |
| --- | --- | --- | --- |
|25|.580|14|15|
|45|.700|31|32|
|75|.820|61|62|
|85|.700|59|60|
|165|.700|115|116|
|175|.700|122|123|

For a supported canonical thousandth share, `aggregationCount` computes the nearest count from its exact integer tick as floor((tick*N+500)/1000). All intermediate integers are small and exactly representable. `aggregationMean` and the complete distribution model use this same helper, so heat color, F/readout, all distribution bars, moments and both majority tails agree. The scope explicitly assigns half-count ties to the larger informed group.

The pure model also supports non-thousandth shares used by the existing fixed-number-of-informed-voters checks and continuous raster coordinates. Those retain their previous floating-point nearest-product evaluation. The correction applies exact rational arithmetic to the declared native tick domain, without epsilon-fudging near-boundary continuous values. Independent checks on both sides of all six ties confirm that a nearby genuinely smaller share still selects the smaller group. No normal approximation, source-data change or new empirical claim is introduced.

## Independent references and regression

The new exact BigInt quotient/remainder oracle exhausts every96odd sizes11–201×1001share ticks,96096cases. It confirms precisely the six former failures and all corrected allocations. A separate70-digit Decimal generator uses one Bernoulli update per individual, independently of the production binomial-convolution method. Its six profiles check all576distribution entries, both majority tails, mean and variance. Committed reference SHA256 `30d7b54c153ec66cdaf07c6a17b6117d31c8e55c6e0d33717fb4ab072acd655b`; regeneration into own temporary output is byte-identical.

All six mathematical groups PASS: two new rounding/reference groups plus all four preserved original groups. The latter retain4320independent individual-DP cases, full small-jury ballot enumeration, fixed-fraction/fixed-count distinctions, Chebyshev comparisons and valid/invalid distribution domains. Logs `/tmp/atlas-worker-three/polsci-aggregation-rounding-evidence/math.log`; reference generator `tests/verification-polsci-aggregation-rounding-reference.py` and new test `tests/verification-polsci-aggregation-rounding.test.mjs`.

The new native runner `tests/verification-polsci-aggregation-rounding.mjs` supports theme then optional width, with `POLSCI_AGGREGATION_OUTPUT` for independent outputs. Each group retains the former endpoint/accuracy/full-distribution/real-keyboard/actual2D-drag checks and adds every one of the six exact half ties by both real pointer and independently edited full saved state. Each then replays exact registered values, readout, all bars/paths/heat samples and handle geometry. Actual numeric slider DOM is compared directly to model values, without a second sanitized DOM oracle. An independent native quotient/remainder check verifies F and21actual heat samples, including all three problematic share ticks. A complete valid all-control state is independently edited/replayed, and18malformed raw states reject visibly with exact whole-default rollback.

The first native instrument probe called the raster at the old generic fallback(3,7), outside the declared share/accuracy rectangle. The new bounded helper correctly rejected it. Both the preserved and new runners now probe an actual selected share/accuracy instead; no production domain was widened to satisfy an invalid test coordinate.

All six1450/430/320×light/dark groups PASS, logs `native-final-{light,dark}.log`, images `native-final/` under own evidence directory. The handle-bound assertion was then strengthened to include its complete6px hover halo; both full narrow theme groups were rerun with this additional assertion, retained separately in `native-halo-{light,dark}.log`/`native-halo/`. All product/model code remained unchanged between these runs.

Personally inspected own corrected N25/f.58 full narrow light view (readout F15), N45/f.7 narrow dark full distribution, N175/f.7 narrow light heat/handle panel and manually edited all-control narrow dark full page. Both exact F and requested/actual-share distinction are legible, every count remains available and complete glyph/stroke/text/TeX/page bounds pass.

Focused static1/0/0 and isolated strict scratch build6684written/6890planned/450chapters/85collections,0errors/warnings, home112715bytes gzip. Temporary generated data remain in `/tmp/atlas-worker-three/polsci-crossfield-build`. Exact baseline comparison against `a27e698` checks all62political-science objects and every syllabus row: only5.8's runtime flag and half-tie scope clause differ at the item-property level; the executable viz function, source claims and all unowned properties remain byte-identical. Private count/mean/model arithmetic changes are the intentional runtime correction. `byteguard.mjs`/`byteguard.log` retain this comparison.

Independent exact-commit peer acceptance and central runtime-finding reconciliation remain the coordinator's responsibility. This follow-up does not reopen an original-body access obligation or claim new source coverage.
