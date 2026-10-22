# Independent review: IMAGING 5 — Ultrasound

The coordinator independently reviewed the 12 frozen chapter identities, all statements/proof ideas/scopes, actual written prerequisites and the final helper formulas. **Accepted on exact author freeze v2.** Source/model, fresh native, critical-state and independent pixel review pass. All eight author hashes passed after the final review; accepted manifest `/tmp/wave5-imaging-root-peer-accepted-freeze-v2.sha256`. All coordinator browsers and local servers are CLOSED.

## Sources and hypotheses

The reviewer read the official MIT 6.013 Acoustics PDF, pages 1–8 / printed 399–406, including linearized fluid momentum/continuity, impedance, intensity and planar interface matching. Printed page 406 was personally inspected as a rendered page. The scalar fluid formula is correctly restricted; it is not used to authenticate solid bone speed, shear conversion or measured tissue constants. The reviewer also read Podkowa, Oelze and Ketterling (2018), section 2.1.5, equations 4–9 and the neighboring clutter-filter discussion, and personally inspected rendered PDF page 5. The sign of the conjugate product and phase-to-frequency scaling agree with the chapter's stated analytic-signal convention.

Source receipts and access stops remain in `/tmp/atlas-wave5-imaging-sources/`. The reviewer does not claim a complete Wagner 1986 body, ASE 2017 guideline, IAEA handbook, NYU lecture, OpenStax body, commercial Prince–Links body or original Kasai 1985 article. Earlier limited excerpts and later CAPTCHA/403/TLS/tool stops are accurately distinguished in the author report. No stopped original was retried or recovered through another copy. The authored CLT/moment argument and actual written PHYSIO 4.18 carry the finite speckle and Bernoulli claims without a full clinical guideline assertion.

Actual prerequisite statement/proof bodies were independently read from the current source catalog: FLUID 1.5/2.8, WAVES 1.4/1.6/1.8/1.14, PROB 2.2.1/3.10.7, LADR 6.14, PHYSIO 4.18 and IMAGING 1.5. String force/velocity impedance is used as an analogy followed by an explicit acoustic boundary derivation. Unwritten FLUID 9.11 and WAVES 8.11 are not proof inputs. Slow-time aliasing is directly proved rather than imported unchanged from a spatial theorem.

## Independent numerical review

The reviewer wrote a separate Node export and a 100-digit mpmath reference: `/tmp/wave5-imaging-root-peer-export.mjs`, `-values.json` and `-oracle.py`. The final reference log `/tmp/wave5-imaging-root-peer-oracle-final.log` passes **3,676 comparisons across 800 cases**. Maximum absolute error scaled by max(1, reference magnitude) is **1.8865299635674115e−13**. Per-quantity relative/absolute bounds distinguish ordinary cancellation, trigonometric conditioning and subnormal rounding; Gaussian/finite-phasor and attenuation comparisons use relative bounds for nonzero outputs rather than a broad absolute zero allowance.

Cases cover fluid speeds, pressure/intensity conservation, tiny/exact-zero attenuation, two-layer echoes, finite pulse and Gaussian responses, geometric array arrivals and finite complex fields, far-field factors, actual pre-gain noise/clipping, independently reproduced seeded complex scatterers, signed Doppler including MIN values and perpendicular incidence, half-open aliases, depth-compatible PRF, Bernoulli conversion and recovery, independently generated 32-sample lag products and finite field profile underflow. A fresh export on the final v2 freeze is byte-identical to the exact 800-case values used by this reference; no helper changed after that calculation. The reference computes its own high-precision complex sums and PRNG stream. It does not call the chapter's formulas to generate expected values.

The first complete reference execution reached the final summary but a reference-only variable-name collision made JSON serialization fail; the error log remains. Renaming the aggregate error variable repaired the reporting script, with no product change. The successful final execution and its tighter small-value checks are the cited evidence.

## Findings and disposition

Independent review found two real tiny-input defects before author freeze: Doppler projected a MIN speed to zero before multiplying by its rescuing frequency scale, and positive attenuation that rounded away lacked its below-range disclosure. Both now pass independent high-precision comparisons. The author then caught a secondary extreme attenuation-depth readout overflow during the requested critical-state check; it reports a positive depth beyond range explicitly. The respective failed logs remain in the author evidence.

The frozen-v1 static frequency legend used two hex tokens contrary to AUTHORING's palette rule. The bounded v2 repair uses named red/blue entries; the quantitative computed RGB map remains unchanged. The eight-file v2 author manifest is `/tmp/wave5-imaging-author-freeze-v2.sha256`. The original v1 manifest remains retained. No scientific equation changed in this presentation repair.

Independent preservation assertions pass for all 12 frozen num/kind/name identities, every non-chapter-5 syllabus value and top-level metadata, all actual written dependencies and the old IMAGING 3.18 verify flag. No old source queue was reviewed or cleared.

## Native review

The fresh independent execution uses the production renderer and instrumented native utility with additional reviewer conservation/arrival/PRF/complex-correlation checks. All 48 layouts, controls/modes/endpoints/raw replay, complete rich/readout bounds and painted shape/text bounds pass. Every item has a real first-canvas change and actual nonfinal Share. The standalone peer runner is `/tmp/wave5-imaging-root-peer-native.mjs`; no production test or content byte was changed for this review.


### Fresh ordinary layout execution

The first 44 distinct layouts pass in `/tmp/wave5-imaging-root-peer-native.log`: **812 actions /428 URL checks /268 actual Shares**. The next physical-change assertion deliberately requires changed first-canvas pixels, but its initial 5.12 probe selected true shift 6000 Hz from 1000 Hz at PRF 5000 Hz. Those frequencies differ by one PRF and correctly give the same analytic samples and painted phasor plot. The failed probe's exact before/after PNGs and zero-difference image remain in `/tmp/wave5-imaging-root-peer-production/`; the failure is a reviewer input-selection error, not a product defect. That incomplete case is excluded from passing totals.

The peer probe now physically selects −6000 Hz for 5.12, whose principal sign differs, and verifies the changed pixels plus an actual nonfinal Share. All four final color-flow layouts pass in `/tmp/wave5-imaging-root-peer-final12.log`: **64 actions /40 URL checks /24 actual Shares**. No product byte changed. The retained fresh ordinary coverage is therefore all **48 distinct layouts, 876 actions /468 URL checks /292 actual Shares**, including an actual changed-canvas physical edit and nonfinal Share for every item. The successful final supplements follow.


### Final supplements, pixels and acceptance

Six overlapping narrow item/theme critical groups pass **32 exact raw states /32 physical Create-link clicks /64 direct-and-Share URL checks /32 actual Shares**, log `/tmp/wave5-imaging-root-peer-critical.log`. They cover exact-zero attenuation, MIN depth/alpha and positive range notices; perpendicular incidence and both signs of MIN speed at axial/30°/89.9° angles; lag Nyquist endpoint signs, cancelled/unresolved correlation, MIN and ±1e−200 phase increments. Actual raw values persist in the scientific readouts and exact Share restorations. The observed minimum marker/ring clearance in this supplement is **9.18103448275862 CSS px**, and measured glyph/halo clearance **3.11562442779541 CSS px**. Complete path/rectangle/circle stroke bounds pass separately; these are observed supplement minima, not a universal minimum over all historical runs.

All three integer controls in speckle reject fractional saved values in both narrow themes: **six negative URL cases**, zero physical actions/Shares, log `/tmp/wave5-imaging-root-peer-integers.log`. Three genuine written-prerequisite links (FLUID 1.5, PROB 3.10.7, LADR 6.14) were physically clicked and their actual target statement/proof bodies verified: **three separate navigation actions**, log `/tmp/wave5-imaging-root-peer-links.log`.

Across passing ordinary and overlapping supplements, the independently executed totals are **911 physical actions /538 URL-state checks /324 actual Shares**, including those three prerequisite-navigation actions. Share clicks are included in actions; Share restorations are included in URL checks. The totals are not additive measures of distinct coverage; distinct ordinary coverage remains 48 layouts. The failed partial alias probe and reference-reporting error are preserved and excluded from these successful counts.

The reviewer personally inspected all 24 narrow defaults, all 24 narrow maxima, all 12 narrow offered-mode captures, all 24 desktop default overviews, full narrow rich 6/8/12 through overlapping crops (including scopes, proofs, refs and prerequisite lists), and full-size critical loss/range, signed MIN Doppler, Nyquist and unresolved color-map states. Captures are under `/tmp/wave5-imaging-root-peer-{production,final12,critical}`; contact sheets/rich crops are `/tmp/wave5-imaging-root-peer-gallery`. Broad desktop overviews supplement detailed narrow review and automated complete bounds; they do not claim readable full-size text at thumbnail scale. Fixture ancestry coordinates are placeholders and do not certify the production atlas graph layout.

All **16 focused mathematical groups** and chapter-static **12 items /0 errors /0 warnings** pass independently (`/tmp/wave5-imaging-root-peer-focused.log`, `-static.log`). Final v2 hashes pass after all supplements. No required finding remains. The chapter is accepted for local integration; its old IMAGING 3.18 source flag and all original-body access limits remain. No browser or local server is left active by this reviewer.
