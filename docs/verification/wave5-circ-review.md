# Independent CIRC5 review

Status: **independently accepted on exact final author-v3 frozen files**. All peer browsers and servers are closed. Only this report and temporary evidence are owned; product repairs are made by the author.

## Sources and actual inputs

Read the actual14 statements/ideas/scopes/captions and pure/UI consumers, author report and receipts under `/tmp/atlas-wave5-circ-sources/`. Independently viewed the actual public MIT capacitor PDF5/9 and inductor PDF5/9 handwritten laws/energy, first-order PDF4/6 equations and initial/final/time-constant construction, energy-processing PDF7/10 switched-RL schematic and periodic-average derivation, and TI SCAA035B PDF8/9 (printed4/5) external-load versus internal power formulas. The MIT handwritten equations require page inspection; extracted headings alone are not the evidence.

The MIT source's power stage is an RL load, while the chapter explicitly derives its different LC-output synchronous model. TI's external-load term is kept distinct from device internal/through/leakage power. No commercial textbook body or ADI full-body read is claimed. The stopped ordinary ADI request was not retried or recovered; charge sharing is independently derived from KCL, RC and a Joule integral. Existing CIRC4.17 source uncertainty remains untouched.

Read actual prerequisite bodies in `/tmp/atlas-wave5-circ-prereqs.json`: charge/current, passive power, KVL, terminal Thévenin equivalence, MOSFET/CMOS abstractions, EM3.8 capacitance, PMA5.1 differentiation and ODE1.4 integrating factor. Independently read actual supplementary KCL CIRC2.1 and constant-matrix-flow ODE3.3 statement/idea; saved `/tmp/wave5-circ-peer-extra-inputs.json`. Unwritten EM9.15/9.17 are not consumed: linear inductance is declared and terminal stored energy is directly integrated. Diode4.1 is related context, rather than a falsely consumed nonlinear diode model in a synchronous converter.

## Claim and implementation disposition

Fixed linear element laws and passive polarity are explicit, including units (µF/V/ms→mA; mH/A/ms→V). Ideal reversible energy and dissipated heat are not conflated. Bounded/integrable-drive continuity excludes ideal impulses; finite energy alone is correctly insufficient. The zero-duration limit reports integrated impulse area and does not invent a finite spike height.

RC/RL step responses have positive time constants, initial continuity and explicit source/topology assumptions. A tangent's unique one-time-constant intersection excludes the constant-response degeneracy. The chosen two-resistor Thévenin topology is not advertised as a general circuit solver. KCL branch currents are computed from that actual network.

Inductive kick requires a specified current path: lossless parasitic LC and a constant-drop/resistive clamp are explicitly different closures. The latter terminates current at its actual zero, not a universal breakdown voltage. The RC integrator/differentiator statements correctly distinguish low/high-frequency transfer approximations from an exact periodic square response and retain DC bias/edge limitations.

Positive-R sharing has charge conservation, the correct capacitance-weighted common voltage and R-independent completed heat with R-dependent time. The zero-R ideal-wire model is not treated as a unique dissipative solution. Gate timing is an actual finite threshold-event/RC machine, with alternating rising/falling delay formulas and a stated finite view window. Switching power counts cyclic completed0→1 events, rather than clock frequency alone; external load only and full swing are explicit.

The synchronous buck solves its two affine intervals and periodic initial state. Negative current is permitted by that selected switch closure, while diode-CCM claims depend separately on resolved positive extrema. Periodic mean voltage is an integrated identity, not a startup guarantee or measured efficiency. The matrix-flow input is genuinely consumed.

## Independent mathematics and findings

Separate reference program `/tmp/wave5-circ-peer-buck-reference.py` compares64 independently selected parameter states with a SciPy augmented3×3 matrix exponential, a separate period-map linear solve, six phase-state samples, adaptive quadrature of mean voltage and derivative-root searches on an80-subinterval grid per switch interval. **896 comparisons pass**; maximum sampled state absolute discrepancy5.5067062022e−14. Evidence `/tmp/wave5-circ-peer-buck-{export.mjs,values.json,reference.log}`. The extrema search and averaging are separate from the author's closed-form2×2 propagator and single-root interval implementation. This finite reference check is not a universal certified error bound.

A400-digit mpmath scan of162 tiny/ordinary sine parameter states, amplitudes, rates and storage constants independently checks physical instantaneous power. It originally found25 discrepancies above a two-ULP/ordinary-relative floor due to multiplying an already quantized subnormal state. Example timeMIN, amplitude5, rate3, storage.1 returned236MIN instead of correctly rounded222MIN. The author now evaluates the tiny-phase power as time times its bounded analytic coefficient; the omitted sinc/cos correction is negligible relative to binary64 in that branch. The complete independent power scan now has zero failures (`/tmp/wave5-circ-peer-small-repaired.log`). Expanded810 scalar references also compare actual state, analytic derivative, conjugate drive, power and energy; all pass (`/tmp/wave5-circ-peer-element-reference.log`).

Other bounded findings sent to the author and repaired before native:

- `first()` used the product of initial/final states to classify signs. Opposite subnormal signs can multiply to−0, which incorrectly satisfies a nonnegative product test. Explicit sign comparisons now distinguish cancellation from same-sign state underflow.
- Two equal common voltagesMIN with C1=C2=.5 retained each voltage but independently rounded both charge terms to0. The repaired tiny-voltage linear sum retains total chargeMIN; equal/unequal common-mode fixtures were rechecked directly.
- At normalized clamp time1−EPS/2, I=.1,R1,drop1.2, cancellation plus a nonnegative clamp returned current0/switch voltage12 although current is about1.06638308415e−17 and the conduction branch remains about13.2V. The endpoint-centered formula `(drop/R)expm1(log1p(RI/drop)(1−x))` now preserves the positive current; exact endpoint1 gives0. Passive inductor voltage also becomes0 after conduction ends. The positive branch is not selected by a tolerance or hidden negative clamp.

A further valid Thevenin fixture, R1=R2=.2,V=v0=MIN,u0, originally propagated rounded VTh0 and obtained iC−10MIN instead of exact initial−5MIN, with a false KCL imbalance5MIN. The author now evaluates the original-source/initial-state linear coefficients before a scaled sum, retains VTh underflow as a separate status, and preserves the direct initial branch currents. The case and u1 continuation are author regressions awaiting native actual Share checks.

The independently executed focused15 groups and scoped static14/0errors/0warnings pass (`/tmp/wave5-circ-peer-focused.log`, `-static.log`); these do not replace external references or native acceptance. Native, actual Share/error/visibility cases, final metadata/freeze verification and independent both-theme1200/320 pixels remain pending author handoff; no author native counts establish independent acceptance.


Additional pre-freeze finding (subsequently repaired in frozen v1): `sharing(1,{C1:.5,C2:.5,V1:2*MIN,V2:0,R:100})` returns transient voltages2MIN/0. The exact original-input coefficients give `(1+exp(-1))*MIN` and `(1-exp(-1))*MIN`, both rounding toMIN. Multiplying the already rounded `delta*rise` by the capacitance fraction causes a second rounding before voltage update. This is separate from total-charge preservation. The author repaired the tiny-input branch with the existing scaled two-original-voltage linear combination, leaving the ordinary branch unchanged. The final source returns both valuesMIN; its actual selected-dot/path and Share fixture will be independently exercised after lane handoff. No frozen source was edited by this reviewer and no final native acceptance is claimed.


Final author-v1 manifest `/tmp/wave5-circ-author-freeze-v1.sha256` independently verifies all eight files. Fresh final15 focused groups and scoped static14/0/0 pass (`/tmp/wave5-circ-peer-focused-final.log`, `-static-final.log`). The peer production utility was copied to `/tmp/wave5-circ-peer-browser.mjs` with import/output paths changed only; no author file was edited. Independent native has not started: the allocated lane is still occupied by the SOLID peer's bounded final check, and root owns the other lane for ENERGY.


## Fresh peer native evidence in progress

The fresh source-aligned peer run on frozenv1 passes all56 actual1200/320 light/dark configurations:2,052 physical actions,700 URL/state checks and416 actual Create-link clicks/restorations, independently observed click counter416. `/tmp/wave5-circ-peer-native.log`, captures `/tmp/wave5-circ-peer-production`. Full marker/ring clearance minimum4.528260870 CSSpx; glyph/halo minimum3.115624428 CSSpx. Full path/rectangle/circle strokes, rich text/math, readout scroll bounds and mode visibility checks pass separately. All eight v1 hashes match both before and after the full run (`/tmp/wave5-circ-peer-v1-post-native-hash.log`). The process closed its browser/server normally.

During offline live-source review, the final common-voltage field was found to retain premature tiny subtraction: equal .5 capacitors and initial0/MIN produced meanMIN rather than rounded0;2MIN/MIN produced meanMIN rather than2MIN. The author repaired only that tiny mean branch through original-voltage coefficients, added tiny-voltage/common/charge quantization disclosure with all-zero exemption, and frozev2 without another author browser. `/tmp/wave5-circ-author-freeze-v2.sha256` verifies all eight final files. Its four-layout ordinary replacement passes136 actions/60 URLs/32 actual Shares (`/tmp/wave5-circ-peer-final11.log`); the full narrow critical set and actual written links are still running serially in the same one allocated lane. These four replace item11's earlier four and do not increase the distinct56 count.

All56 default component images and40 narrow mode images have been personally inspected in `/tmp/wave5-circ-peer-gallery-v1/`, with96 source-image uses and exact image SHA256 values in its manifest. Actual narrow views are retained at native320px; wide sheets serve layout comparison. Selected rich proof/max/raw and finalv2 item11 images remain for final inspection after the critical gate. No new plot/legend/layout finding appeared during this inspection.


## Final acceptance — author v3

Accepted exact eight-file `/tmp/wave5-circ-author-freeze-v3.sha256`, copied to `/tmp/wave5-circ-peer-accepted-freeze-v3.sha256`. All hashes match before and after final native execution. The original-body access stops and earlier4.17 flag remain untouched; no original source was recovered or new historical-body claim introduced.

Final evidence is deliberately reported by process rather than adding overlapping coverage:

- Fresh full56:2,052 physical actions/700 URL checks/416 actual Share clicks and restorations, actual click counter416. v1 source was exact throughout. Item11's four configurations are subsequently replaced by finalv2 four/136 actions/60 URLs/32 Shares; these do not create60 distinct configurations.
- Final narrow critical set:14 item/theme groups,48 raw states,96 physical actions/96 URL checks/48 actual Shares, actual click counter48, on finalv2 science/UI (`/tmp/wave5-circ-peer-critical-v2.log`). It includes tiny sine power, both impulse storage branches, mixed RC signs/charging time, direct-source Thévenin composition, joint flyback endpoint parameters, common/subnormal sharing and exact-zero notice exemption, and three buck regimes. Complete actual paths/dots/readout values and replayed inputs are checked, not only finite/label tests.
- Three actual written prerequisite links mount their current source runtime and complete statement/proof:5.5→ODE1.4,5.8→CIRC2.1,5.14→ODE3.3. Three physical link clicks, no Share count (`/tmp/wave5-circ-peer-links-v2.log`).
- Finalv3 changes only the malformed5.5 prose splice. Both actual320 themes pass final default/rich text/math/ink capture with zero control/Share counts (`/tmp/wave5-circ-peer-grammar-v3.log`). Both corrected full statement/scope images were personally inspected. All other source, model, UI, metadata and test bytes stayv2.

All56 defaults and40 narrow mode images were personally inspected. Selected full narrow rich pages3/5/9/11/14 were inspected from title through statement, scope, readout, proof, source and dependency area. Final tiny power, original-source current/KCL, joint near-stop current, actual two-path sharing, zero-input/no-warning and signed/non-CCM buck captures were inspected full-size. Actual raw values remain scientific in readouts when a finite plot window cannot visibly resolve them. Wide defaults were inspected as two-theme layout sheets; the complete native glyph/halo and rich bounds were measured at their actual1200 width.

Marker/ring minimum4.528260870 CSSpx and glyph/halo minimum3.115624428 CSSpx refer to those measured categories; full path/rectangle/circle stroke bounds pass separately. No remaining source/model/control/visual finding is open. The fifteen focused groups and scoped14/0/0 static checks pass on the final science; no full suite or Git action was run by this reviewer. This acceptance covers the declared finite ideal lumped models and preserves their measured-data, nonlinear-device, startup and source-access limitations.
