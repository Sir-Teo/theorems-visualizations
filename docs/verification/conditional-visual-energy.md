# Conditional-control visual review: energy partition

Agent review, not the human339 sample. Updated 2026-10-19T02:41:03.213654+00:00. Zero-based inventory index modulo4 equals1:27 assigned items. Only completed passed capture rows with actual PNG paths are reviewed.

Reviewed 54 item/theme rows, 332 PNG references (239 distinct images). Pending item/theme rows: 0. Each entry in the JSON records its exact content hash, every inspected PNG SHA256, state path/readout and duplicate linkage. Contact sheets contain all distinct screenshots; exact duplicates retain the same inspected image identity.

| Item | Theme | PNGs | Unique | Finding |
|---|---|---:|---:|---|
|algo-10.1|light|8|5|No defect observed|
|arch-3.3|light|4|4|No defect observed|
|cg-2.12|light|1|1|No defect observed|
|cplx-2.6|light|18|11|Found issue; focused fix verified|
|deep-2.11|light|1|1|No defect observed|
|algo-10.1|dark|8|5|No defect observed|
|arch-3.3|dark|4|4|No defect observed|
|cg-2.12|dark|1|1|No defect observed|
|cplx-2.6|dark|18|11|Found issue; focused fix verified|
|deep-2.11|dark|1|1|No defect observed|
|energy-1.1|light|18|12|No defect observed|
|energy-1.1|dark|18|11|No defect observed|
|game-4.11|light|6|4|No defect observed|
|ladr-6.26|light|6|4|No defect observed|
|ladr-8.57|light|1|1|No defect observed|
|game-4.11|dark|6|4|No defect observed|
|ladr-6.26|dark|6|4|No defect observed|
|ladr-8.57|dark|1|1|No defect observed|
|logic-5.13|light|4|4|Found issue; focused fix verified|
|logic-5.13|dark|4|4|Found issue; focused fix verified|
|mech-13.1|light|4|4|No defect observed|
|mech-13.1|dark|4|4|No defect observed|
|mfd-3.13|light|1|1|No defect observed|
|mfd-3.13|dark|1|1|No defect observed|
|music-3.3|light|7|5|No defect observed|
|music-3.3|dark|7|5|No defect observed|
|pchem-2.12|light|6|4|Found issue; focused fix verified|
|pchem-2.12|dark|6|4|Found issue; focused fix verified|
|phil-2.1|light|1|1|No defect observed|
|phil-2.1|dark|1|1|No defect observed|
|pma-11.5|light|1|1|No defect observed|
|pma-11.5|dark|1|1|No defect observed|
|prob-5.2.2|light|1|1|No defect observed|
|qm-1.3|light|6|5|No defect observed|
|rep-1.2|light|36|21|No defect observed|
|prob-5.2.2|dark|1|1|No defect observed|
|qm-1.3|dark|6|6|No defect observed|
|rep-1.2|dark|36|22|No defect observed|
|robot-1.1|light|4|3|No defect observed|
|stat-1.1|light|4|3|No defect observed|
|stat-2.17|light|4|3|No defect observed|
|robot-1.1|dark|4|3|No defect observed|
|stat-1.1|dark|4|3|No defect observed|
|stat-2.17|dark|4|3|No defect observed|
|stoch-2.10|light|1|1|No defect observed|
|stoch-2.10|dark|1|1|No defect observed|
|thermo-2.1|light|1|1|No defect observed|
|toc-3.9|light|11|11|No defect observed|
|thermo-2.1|dark|1|1|No defect observed|
|toc-3.9|dark|11|11|No defect observed|
|top-1.8|dark|1|1|No defect observed|
|top-1.8|light|1|1|No defect observed|
|xtal-3.6|light|10|6|Found issue; focused fix verified|
|xtal-3.6|dark|10|6|Found issue; focused fix verified|

Visual checks cover meaningful diagram content, readable labels/context, controls and restoration, clipping/overlap, finite/sensible readouts and both palettes. This is a visual assessment of captured states, not an independent source proof or new execution. No unarrived row or state without a PNG is claimed inspected.

Minor caveat: cplx2.6 caption calls the shaded region the LP relaxation, although the renderer shades forbidden regions/cut planes red and the feasible locus green. Default feasible region is a line segment. Source confirms the drawings are intentional; the blanket caption wording is imprecise. Parent authorized the local correction; focused fix verified in conditional-energy-fixes.md/.json.

Proposed CPLX2.6 replacement for the sentence beginning “The shaded region is the LP relaxation”: In the plane, red shading marks the regions excluded by individual clauses; the feasible LP polygon or segment is green, and the gold point marks the LP optimum. In the cube, red triangles mark the planes cutting off individual corners, rather than shading the full feasible intersection. In the plane, rotate the **objective direction** to see the LP optimum (a vertex of the feasible region, possibly fractional) next to the best *integer* point.

Minor logic5.13 readout formatting: conditional abs(x) states display a literal scientific-notation TeX command. The final v.sci interpolation at content/logic/ch05-b.js:415 needs dollar delimiters. Parent authorized the local correction; focused fix verified in conditional-energy-fixes.md/.json.

Minor pchem2.12 ammonia annotation overlap: target label is crossed by the zero axis and the target dashed line crosses the baseline context. Source anchors and proposed screen-space spacing recorded in JSON; parent authorized the local correction; focused fix verified in conditional-energy-fixes.md/.json.

Original XTAL3.6 defect: c/n glide paths were clipped above the stage, and the applications control8 was silently capped at6. Parent authorized a local fix: requestedk is now honored and all actual projected points fit the rotated view. Independent65case affine validation and48native states in both themes passed; all new screenshots inspected. See xtal-glide-followup.md/.json. Source frozen for parent refresh.

Pending: none

## Final resumed-capture reconciliation

Both resumed theme reports finished complete and ok before reconciliation. All27assigned items in both themes are covered: **54item/theme rows,332current PNG references,pending0**. Current content/runtime hashes and exact screenshot SHA256s are appended in JSON `refreshRows`; original rows, findings, hashes and76archived affected PNGs are retained unchanged.

**80PNG paths changed** against their same original state.253current references exactly match an already inspected PNG and receive image-only inspection credit. The remaining79references contain54distinct new PNGs, all inspected in11contact sheets (LOGIC restoration additionally opened individually). One of the80changed paths matches an image already inspected at another state. Changed REPdark captures were inspected as well. This transfers no source, semantic or human-review credit.

The refreshed captures confirm the CPLX caption, LOGIC scientific math, PCHEM near-zero annotation spacing and XTAL full glide/count corrections in both themes. No new defect was observed; all332current required supplemental PNG references have exact-image inspection coverage. No source, runtime, runner or inventory edits and no browser launch were made for this reconciliation.
