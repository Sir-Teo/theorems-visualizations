# Psychology 4.4 / 4.7: discrete pooling and nonnegative recurrent inhibition

Status: candidate ready for independent review (2026-10-20). Independent source re-reading, ten mathematical groups, scoped static checks and all 12 native item/theme/viewport matrices pass. Both uncertainty flags remain **true** until coordinator acceptance; this candidate recommends resolving psych-4.4 and psych-4.7 after that review.

Owned scope is only the two numbered objects and isolated imports in `content/psych/ch04.js` / `ch04-b.js`, their two syllabus rows, the new `source-audit-pooling-inhibition.js`, the two focused verification files and this report. The separately accepted 4.1/4.2/4.3/4.5/4.6/4.8 and all other objects, shared runtime/data and central records are preserved. Exact chapter prefix/suffix and syllabus-row guards pass.

## Actual sources and written prerequisites

* H. K. Hartline and Floyd Ratliff (1957), [*Inhibitory interaction of receptor units in the eye of Limulus*](https://doi.org/10.1085/jgp.40.3.357), *Journal of General Physiology* 40:357–376. Actual 20-page original scan obtained from [this indexed scan](https://pdfs.semanticscholar.org/4647/5ba5e2d1bcfce0a56a2943ae6a55be6edf8a.pdf), local `/tmp/atlas-psych-pooling-inhibition-sources/hartline-ratliff-1957.pdf`, SHA256 **f1f229b72018b2030723a6cf9eac0dba4a0010a61bdfee6abd8e5e4c3524ed70**. Read methods pp.357–359, pair/threshold evidence pp.363–366, disinhibition pp.368–372, equations/restrictions pp.372–375 and summary pp.375–376. Inspected original equation/restriction images at printed pp.372/374 (`...-pdf16.png`, `...-pdf18.png`). The source explicitly excludes negative inhibition below an emitting threshold and replaces a silenced receiver's response by zero. Thresholds and coefficients can differ by direction. Figure 2 concerns optically isolated pairs; the fitted Figure 7 illustration used small illuminated groups, as p.374 acknowledges. Page 375 introduces the additive extension and points forward to later spatial-summation experiments. This audit does **not** claim to have read that later original, or to fit the authored 25-unit network to the measurements.
* MIT 6.02 draft course notes, Chapter 12, [*Frequency response of LTI systems*](https://ocw.mit.edu/courses/6-02-introduction-to-eecs-ii-digital-communication-systems-fall-2012/43ab3e7240ebab8bbdcde3a8601abdac_MIT6_02F12_chap12.pdf), last update 3 November 2012. Actual official 23-page PDF retained as `mit-602-2012-ch12.pdf`, SHA256 **dd627ef32f6fe8521b1b37fdaa288d23efebb95703947134d936fbfd5d3b18fc**. Read §12.1.1; §12.2 through Example 1; §12.2.1 periodicity/DC properties; §12.2.2 Example 4 (printed pp.162–168 and 170–171). Inspected actual formulas/plots on pp.166/171 (`...-pdf6.png`, `...-pdf11.png`). This is an identified technical exposition of discrete moving averages and phase, not a retinal measurement.

The source cache retains PDFs, extracted text and inspected renders in `source-manifest.json`. Read the actual written `prob-2.2.1` statement/argument expanding variance and eliminating covariance terms, and `pma-9.23` contraction statement/proof using completeness and a geometric tail. The accepted `psych-4.1` body was read as anatomical context; it does not establish these authored uniform groups. Barlow's 1958 original pp.337–350 was fully read in the separately accepted 4.5 audit; its conditional psychophysical summation does not identify a uniform anatomical pool. No unread historical priority or exact convergence-ratio claim remains in these two objects.

## 4.4: the finite aperture, actual coverage and phase

The old renderer averaged discrete receptor values while its transfer graph/readout used the continuous box sinc. In particular its singleton pool attenuated frequencies despite doing no averaging. The old six-receptor spot formula also ignored alignment with fixed pool boundaries and showed a clipped noisy realization unrelated to the stated variance calculation.

The replacement has 48 point receptors at `i + .5`. Every offered pool size `{1,2,3,4,6,8,12}` divides 48, so displayed groups partition all records without an omitted short group. Bars show expected receptor values and their actual discrete averages. Independent zero-mean unit-variance noise is an explicit assumption; no clipped realization is drawn and Gaussianity is unnecessary for the variance/SNR result.

For a pool of size `g` containing `k` covered receptors, signal/noise of the sum are `k*s` and `sqrt(g)`, so SNR is `k*s/sqrt(g)`. Averaging divides both by `g`. The right plot compares the **best single pool** at each size for the current finite spot. Alignment matters: a six-receptor spot aligned with a six-pool favors `g=6`; the same width straddling that boundary can favor `g=4`. Positive common signal does not affect ranking: exact integer cross-products compare `k²/g`, retain every mathematical tie, and avoid false ties from subnormal SNR underflow. At zero signal or an empty spot every size ties. Numerical SNR readouts can still underflow.

The spot has position `[0,48]`, width `[0,12]` and half-open point membership `[centre−width/2, centre+width/2)`, clipped by the finite row. Zero width covers no point. A positive subnormal width still contains a receptor exactly at its centre. An additional boundary case required care: centre `1e−20`, width `1` includes receptor `.5`, even though a floating subtraction rounds its distance to `.5`.

Membership therefore uses exact integer numerators of represented binary64 inputs. In units `2^−1074`, a normal nonnegative value with exponent field `E` and fraction `m` has numerator `(2^52+m)·2^(E−1)`; a subnormal has numerator `m`. Receptor `i+.5` has numerator `(2i+1)·2^1073`. Testing

    −W ≤ 2(X−C) < W

with these integers exactly implements both boundaries without rounded differences or an underflowing `width/2`. BigInt intermediates remain local; model/state records contain ordinary serializable numbers and booleans. Plotted endpoint coordinates are explicitly labeled rounded. Centre, width and signal readouts retain 17 significant digits to distinguish adjacent states.

Gratings use authored offset `.5`, amplitude `.45`, frequency `[0,.5]` cycles/receptor and phase `[0,1]` cycles. The aperture is the finite complex sum

    H_g(f) = sum(exp(−2πifj), j=0..g−1) / g.

Its gain is 1 at DC and at every frequency when `g=1`. Away from removable endpoints, its magnitude is `|sin(πfg)/(g sin(πf))|`, derived by a finite geometric series. Each displayed group mean retains both phase and group location. The post-pooling sample separation is `g`, so its Nyquist frequency is `1/(2g)`; this is distinct from aperture attenuation. At receptor Nyquist `f=.5`, phase 0 samples the cosine at zero crossings although the singleton aperture gain is 1; phase `.25` reveals alternating values. No finite displayed modulation range is mislabeled as transfer magnitude, and no reconstruction or visual-acuity guarantee is inferred.

## 4.7: rectification, contraction and independent optimality checks

The old all-active equation had the wrong sign on the threshold term. Its fixed 200-step damped recurrence did not solve the offered strong-coupling cases, and negative rates were drawn with a lower clamp. The replacement uses the source-supported two rectifiers and an explicitly authored domain:

    F(r) = max(0, e − K max(r−t,0)),  t=.1.

There are 25 finite units, with excitation `.35` or `1`. Raw symmetric off-diagonal weights are `exp(−(distance−1)/spread)` for integer distances 1–8 and zero otherwise. Spread is `[.5,5]`. One **global** maximum-row-sum normalization preserves symmetry; strength is `q∈[0,.9]`. Per-row normalization is not used. Finite ends and clipped patches are explicit.

In exact arithmetic, `F` maps the complete box `[0,1]^25` into itself and is `q`-Lipschitz in infinity norm. The contraction theorem proves existence, uniqueness and convergence throughout the continuous offered domain. For any candidate,

    ||r−r*||∞ ≤ ||r−F(r)||∞ / (1−q).

Production evaluates a floating residual and corresponding error **estimate**, using the computed row sum. Roundoff is not enclosed; no rigorous interval certificate is claimed. The one-pass option applies the same rectified map once to uninhibited excitation and displays its actual residual. It is a comparison, not automatically a solved fixed point.

When all units are above threshold and unsilenced, the correct equation is `(I+K)r=e+Kt`. For the constrained case, set `u=max(r−t,0)`. Since `t≥0`, the fixed-point equation is equivalent to

    u≥0,  v=(I+K)u−(e−t)≥0,  u_i v_i=0.

If `u_i>0`, then `r_i=u_i+t=e_i−(Ku)_i`. If `u_i=0`, the inequality gives `e_i−(Ku)_i≤t`, so the recovered nonnegative `r_i` also has `max(r_i−t,0)=0`. Symmetry and strict diagonal dominance put the eigenvalues of `I+K` at least `1−q>0`; the associated nonnegative quadratic program is strictly convex and has this unique solution. This supplies an independent optimization reference, rather than treating production iteration as proof.

The source's maintained Limulus responses are not claimed to validate the chosen symmetric kernel, common threshold, finite grid or relative excitation scale. No universal edge enhancement, human brightness prediction, Nobel-priority claim or vertebrate-mechanism identity remains.

## Mathematical and source evidence

`node --test tests/verification-psych-pooling-inhibition.test.mjs` passes **10 groups**, log `/tmp/atlas-psych-pooling-inhibition-math-final.log`:

* Finite aperture versus a geometric-series reference; actual phase-aware group averages; singleton/DC limits, exact curve endpoints and sampling bounds.
* Finite spot coverage/partition conservation; independent equal-weight variance; zero-signal and empty-spot ties.
* Symmetric global normalization, strict diagonal dominance and contraction inequalities at endpoint/off-grid strengths and spreads.
* **540** recurrent corner states versus a separately implemented nonnegative-QP coordinate minimizer, with complementarity and residual/error-estimate checks. The reference does not use the production Picard recurrence.
* One-pass rectification/residual, malformed-domain rejection and continuous off-grid preservation.
* Nyquist phase ambiguity, alignment-dependent optimal size and the corrected all-active equation.
* Exact positive-signal ranking at `MIN_VALUE`; positive subnormal spot widths versus a true zero-width spot.
* Exact half-open membership at sub-ULP boundary shifts, then **321 independent rational-reference fixtures**, each checking all 48 point outcomes.

The rational reference uses Python `Fraction` on exact represented binary64 values, not the production bit conversion. Cases include centres 0/MIN/`1e−300`/`1e−20` and adjacent values around `.5`, 1, 12, `12.5`, `47.5`, 48; widths 0/MIN/next-MIN, tiny positives, exact double-distances and adjacent widths around them, through the full width 12. Pure generator `/tmp/atlas-psych-pooling-membership-reference.py` and output JSON are retained for independent regeneration. The default test embeds the resulting exact masks and has no Python runtime dependency.

The mathematical draft was run outside the default glob before promotion. Root independently passed all ten final groups and static checks. A read-only counter-review of the model proposal separately confirmed the contraction/QP argument, including the necessary `t≥0` premise and global symmetric normalization; it did not claim another original-paper or native audit.

`node scripts/check.mjs psych-4.4 psych-4.7 --static` passes **2 items / 0 errors / 0 warnings**, log `...-static-final.log`. Exact neighbor/row guards pass in `...-scope-final.log`. No full build or central/Git/shared-data mutation is part of this batch.

## Native checks and honest attempt lineage

The focused runner is `tests/verification-psych-pooling-inhibition.mjs`. The final matrix is 1450/430/320 pixels in both themes for both items. It checks actual DOM control endpoints/corners, every pool/stimulus/mode choice, intermediate values, pointer interiors/clamps, keyboard, exact model/saved replay, malformed-state fallback, source-derived calculations and complete path/rectangle/marker/ring/hover/text/TeX/page bounds. Filled/hollow strokes and hover halos are included. Same-browser renderer/state records are exact; cross-engine derived numbers allow `2e−12` math-library differences.

Native range serialization is checked against a fresh detached range assigned the exact model string. Adjacent values below native serialization resolution use the widget controller setter followed by exact saved replay. **23** independent rational-reference boundary states check all actual browser input values and the rendered audit, preserving the exact model values even if the native thumb serializes a nearby number. A retained witness is model width `.9999999999999999`, DOM/oracle `1`. The readout distinguishes the model's actual width.

Preview-response runs substituted only the /tmp object drafts in their own browser; both 320-light previews passed. They are not final repository-byte acceptance. The first 4.4 preview caught overstrict Node/Chromium curve equality around `1e−16`; the same-browser curve comparison remains exact. The first 4.7 preview caught real narrow TeX overflow; its equivalent compact matrix-component equation fixes that problem. Preview logs and pictures are retained separately.

The first repository run passed 1450/430-light before the additional dyadic membership issue was found. It was deliberately interrupted and retained as `...-native-pre-dyadic-interrupted.log`, not counted as final evidence. After the exact repair, the next full run passed 1450/430-light, then timed out in Playwright `scrollIntoViewIfNeeded` while waiting for stable geometry at 320-light. No model/geometry assertion failed first. That unclassified attempt is preserved as `...-native-scroll-attempt.log` and `...-scroll-attempt.png`; it is neither a completed pass nor a proven production defect. Parent encountered the same wait in another suite; an unchanged isolated rerun there passed, but the cause remains unproven.

### Isolated worktree completion, 2026-10-20

Worker two independently re-read the retained original Hartline–Ratliff scan (methods, pair interactions, disinhibition, equations/restrictions and summary) and the official MIT notes (§§12.1.1–12.2.2). Actual page images at Hartline–Ratliff printed pp.372/374 and MIT p.171 were inspected again. The represented hypotheses, historical claims, parameter choices, finite geometry, rectification and algebra match those sources and the explicitly authored limits; no new unresolved source claim was found.

The native runner now scrolls through the DOM with immediate behavior before awaiting fonts and two render frames. This removes the test's stable-geometry scroll wait without weakening any model, interaction, saved-state or bounds assertion. It does not establish the cause of the historical timeout. Its output directory defaults to `/tmp/atlas-worker-two/pooling-inhibition` and can be overridden with `PSYCH_AUDIT_OUTPUT` for isolated reruns.

The exact repository-byte run passes **all 12 matrices**: each of 4.4/4.7 at 1450/430/320 pixels in light/dark. Evidence is `native.log` in that directory. The independent mathematical suite passes ten groups (`math.log`), and scoped static checks pass two items, zero errors/warnings (`static.log`). Exact unchanged-neighbour and syllabus-row comparisons against starting commit dad83c6 pass; `git diff --check` passes. No generated data or shared runtime file is changed.

Worker two inspected full-page default, alignment, off-grid and one-pass images in both themes and individual narrow panels, including 4.4 default 320-light transfer and 4.7 default/off-grid/strong-edge 320-light/dark panels. Labels, endpoints, markers, controls and readouts remain legible and contained. All the other retained screenshots support the exhaustive numeric/bounds matrix; a screenshot's existence alone is not represented as human inspection of that file.

Recommended resolution: psych-4.4 and psych-4.7. Remaining source uncertainty in this candidate: none identified. Remaining acceptance requirement: independent coordinator review. Both flags therefore stay true in the candidate commit. The other eight psychology queue entries remain unchanged and open.
