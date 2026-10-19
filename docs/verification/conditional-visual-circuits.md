# Conditional-control visual review: circuits partition

Read-only AI visual inspection of inventory indexes divisible by four: **27 assigned items**. This is not human339 review credit. Reviewed **27 items / 54 item-theme rows / 226 supplied PNGs** so far. Only completed passed supplemental rows and PNGs actually opened through contact sheets/originals are recorded. Missing supplemental root-visible mode images are intentional and are not claimed reviewed.

|Item|Themes inspected|Captured PNGs|Finding|
|---|---|---:|---|
|alg-3.30|light, dark|20|No material visual defect in captured states|
|algo-6.4|light, dark|12|No material visual defect in captured states|
|causal-2.2|light, dark|14|Context-label defect; authorized fix validated|
|cplx-2.10|light, dark|2|No material visual defect in captured states|
|deep-1.8|light, dark|8|No material visual defect in captured states|
|em-1.1|light, dark|8|No material visual defect in captured states|
|game-1.2|light, dark|8|No material visual defect in captured states|
|kin-1.5|light, dark|8|Reference-rate wording; authorized fix validated|
|ladr-8.49|light, dark|2|No material visual defect in captured states|
|logic-1.2|light, dark|16|No material visual defect in captured states|
|mech-1.7|light, dark|8|No material visual defect in captured states|
|mfd-2.9|light, dark|2|No material visual defect in captured states|
|micro-6.2|light, dark|16|No material visual defect in captured states|
|opt-3.6|light, dark|12|Math explanation; authorized fix validated|
|pharm-1.2|light, dark|8|No material visual defect in captured states|
|pl-3.1|light, dark|12|No material visual defect in captured states|
|prob-4.8.3|light, dark|2|No material visual defect in captured states|
|qchem-1.10|light, dark|2|No material visual defect in captured states|
|rca-16.6|light, dark|2|No material visual defect in captured states|
|rep-3.3|light, dark|20|Complex table overlap; reported to root|
|soc-2.7|light, dark|12|No material visual defect in captured states|
|stat-2.10|light, dark|2|No material visual defect in captured states|
|stat-6.20|light, dark|2|No material visual defect in captured states|
|tech-4.12|light, dark|2|No material visual defect in captured states|
|toc-3.5|dark, light|8|No material visual defect in captured states|
|top-1.2|light, dark|16|No material visual defect in captured states|
|waves-4.12|light, dark|2|No material visual defect in captured states|

## Finding for the final repair batch

**causal-2.2**, both themes, states7–9: with12units selected and self-selection enabled, the newly visible selector still says **draws(40units)**. The caption also describes8/12 exact enumeration without limiting that statement to randomized treatment. Actual calculation/readout use12units correctly. Source anchors: content/causal/ch02.js:94 and:120. Proposed label: **simulated assignments**. Proposed full caption:

> Left: a fixed population, each unit a bar from $Y^0$ to $Y^1$; the filled end is revealed by this assignment. Right: the sampling distribution of the difference in means. With randomized treatment, all $\binom Nm$ assignments are enumerated for 8 or 12 units. For 40 units, or when units choose their arm, the selected number of simulated assignments is used. Under randomization the estimate is unbiased: the exact-enumeration mean (gold) agrees with the true average effect (black) up to rounding, while a finite simulation fluctuates around it. Switch on **units choose their arm**: higher-baseline units are more eager, and the estimates centre away from the true effect. Unbiasedness needs randomization, not just a difference in means.

**kin-1.5**, both themes, conditional second-order state2: the slider is labeled k(s⁻¹), but source uses it as a first-order reference and transforms it to the second-order constant. Suggested label **reference k₁ (s⁻¹)** and caption addition: The slider sets a first-order reference rate k₁; the second-order comparison uses k₂=k₁/([A]₀ ln2), with[A]₀=1M, so their initial half-lives match. Source anchors ch01.js:275,287–292. No numerical defect inferred.

**opt-3.6**, both themes, conditional state22: f₁=x²/2 and g=t², but the readout falsely says f₁ takes negative values. The source hardcodes this at ch03.js:386; g is nondecreasing on the actual nonnegative range, so the composition argument works there. Plot x⁴/4 and chord result are correct. Make applicability range-aware and change caption (:334) from conclusion fails to conclusion can fail.

**rep-3.3**, both themes, states1–9: conditionalZ/5 complex values overflow across character-table columns, so χA/χB/direct/formula cells collide. DefaultS3real table is legible. Requires compact/stacked complex cell formatting or responsive width; numerical bar/ring agreement remains coherent. Reportedto root for assignment.

Root authorized the three CAUSAL/KIN/OPT source fixes and focused validation; source edits implemented and 60 native states passed (including the authorized OPT orientation wording follow-up) in both themes; separate focused report records current-source evidence. REP edit remains with root assignment. The original screenshot findings and captured hashes are retained here.

## Evidence and pending coverage

[conditional-visual-circuits.json](conditional-visual-circuits.json) records each captured collection content hash, actual PNG SHA256, state/control path, readout, inspection sheet and findings. Contact sheets are in `/tmp/conditional-circuits-visual`; each PNG was checked for readable diagrams/context, labels, clipping/overlaps and nonsensical/nonfinite results. Item-specific scope notes are in the JSON.

Still pending captures or visual inspection: . No pending row is counted as reviewed.

## Final refreshed capture reconciliation

Both conditional reports completed successfully before reconciliation. The current27assigneditems /54item-theme rows contain226requiredPNG captures: **54changedPNG files were opened and inspected**, and **172PNG files are byte-identical** to previously inspected images. **Pending:0.** Hash equality carries image-only inspection credit; it adds no semantic, source or human339 review credit. No source, runner, inventory or runtime edits and no browser launches were made during this refresh review.

All54changed captures belong to CAUSAL2.2(14), KIN1.5(8), OPT3.6(12) and REP3.3(20). The correctedCAUSAL simulation label/caption, KIN reference-rate label/formula and OPT range-aware applicability/chord wording are visible and coherent in both themes. REP complex cells now show separate real/imaginary lines inside their columns, without the previous collisions; direct/formula bars and rings agree. No further material defect was found in these current captures.

The top-level `refreshRows` records exact currentPNG SHA256s, content/runtime hashes, states, reportSHA256s and inspection basis. Original item rows, original finding descriptions and old hashes are preserved. [conditional-visual-circuits-original-manifest.json](conditional-visual-circuits-original-manifest.json) preserves the original226PNG manifest; old screenshot paths may now contain refreshed bytes, so their original hashes remain historical evidence. [conditional-circuits-fixes.json](conditional-circuits-fixes.json) and [rep-character-layout-followup.json](rep-character-layout-followup.json) retain focused correction evidence.
