# Patch-plan preparation for practitioner review

P07-L02 · 23 October 2026. The [dataset](patch-plans-20261023.json) makes the three proposed diagram cases concrete and supplies an empty physical-evidence record plus four review questions. It preserves the [earlier brief](../p07-02-repair.md) and [source review](../review-craft.md). No new source retrieval, specimen, practical sewing instructions, runtime lesson or physical pass is claimed.

## Read the diagrams as proposals

All plan views use a 100 × 100 base and a rectangular hole from (40,40) to (60,60). Coordinates are **dimensionless schematic units**, not material dimensions or stitch spacing. x increases right; y increases down. Dashed patch outlines and dotted fill differ from the base's diagonal hatch. Numbers identify proposed through-locations. Joining dashes show ordering only; they do not specify a needle or over/under thread path. The accompanying local cross-section shows the intended layers at location 1, with arbitrary drawn thickness and separation.

| Plan | Patch corners | Numbered through-locations, in order | Diagram facts |
| --- | --- | --- | --- |
| [1 · Through both layers](assets/patch-plan-through-layers.svg) | (30,30), (70,70) | (35,35), (50,35), (65,35), (65,50), (65,65), (50,65), (35,65), (35,50); closed | Covers all 400 square units of the hole; every marked location meets patch and intact base. |
| [2 · Missing base](assets/patch-plan-miss-base.svg) | (30,30), (70,70) | (45,45), (50,45), (55,45), (55,50), (55,55), (50,55), (45,55), (45,50); closed | Covers the hole, but every marked location lies over the hole and misses base material. |
| [3 · Partial coverage](assets/patch-plan-partial-cover.svg) | (30,30), (50,70) | (45,35), (35,35), (35,50), (35,65), (45,65); open | Covers 200 of 400 square units; the right half remains uncovered. Marked locations meet both layers, but the proposed path is also intentionally incomplete. |

These statements can be checked from the drawing. None establishes attachment, suitable tension, fastening, resistance to fraying or durability. Plan 1 passes two geometric predicates; calling it a successful physical repair would require different evidence. Plan 3 is an evidence-comparison case with more than one limitation, not a controlled test of one construction variable.

## Concrete review and reproduction inputs

The four unfilled cards ask a sewing practitioner to select the limited claim and materials; specify construction, start/end fastening, tools, spacing and handling; agree the inspection and second-person reproduction; and review access routes and exact media permissions. No practical sequence should be inferred from the numbered marks before those decisions exist.

The empty specimen record has fields for actual dimensions/units, reviewed construction, operator/specimen codes, deviations, an inspection method agreed before making, observations, front/back/edge assets, permissions and second-person reproduction. Missing fields stay null, and empty asset arrays mean no asset was collected. A retained non-sewing analysis route can compare these same diagram facts without claiming hand skill or equivalent physical experience. No real participant or personal record is created here.

The [offline preparation audit](check-studio-preparation-20261023.py) checks rectangle overlap, every marked location, cross-section presence, asset identities and empty evidence states. The [independent content/diagram review](review-patch-plans-20261023.md) states its actual scope. Neither is a sewing practitioner's approval or observation of making.

Earlier iFixit/Sewing & Craft Alliance readings remain historical, with their exact limits and rights records unchanged. No source figure, handout, photo, textile pattern or loom design is copied. The new SVGs and prose are original proposals; final public-release terms, actual sample permissions, practitioner review, physical reproduction, applicable learner/access evidence and final artifact review remain open. The [integration package](../../../integration/studio-preparation.md) preserves the current P07/P08 drafts and both occupied slots.
