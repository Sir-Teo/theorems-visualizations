# P05-L02 · A field water balance with explicit constraints

Research brief, 2026-10-22. Parent: P05 agriculture. Audience: readers who can separate measurements from models after the soil-water pilot. Planned only; this is not a field recommendation. Sources `seq-umn-checkbook` and `seq-ndsu-ae792` are recorded in [sources.json](sources.json).

## Question and evidence

Which inputs would make an irrigation decision defensible for one field? [UMN's checkbook method](https://extension.umn.edu/natural-resources/conservation/agricultural-soil-and-water/irrigation/irrigation-scheduling-checkbook-method) describes deficit accounting and field checks. [NDSU AE792](https://www.ndsu.edu/agriculture/extension/publications/irrigation-scheduling-checkbook-method), reviewed February 2024, adds soil, crop, root-zone, system-capacity and growth-stage context. Its North Dakota temperature/stage estimates are not universal crop water use.

The proposed case is an explicitly fictional North Dakota corn field. NDSU's ninth-week, 85°F example supplies an estimated 0.25 inches/day of crop water use. The source distinguishes full rooting depth from the 36-inch management depth used for corn. Actual growth stage must be checked rather than inferred from a week number. No parameter is inferred from the first pilot's Wisconsin samples.

## Planned exploration and arithmetic

Use a daily ledger with separate labels for hypothetical gauge observations, estimated crop use, assumed storage and forecast inputs. The original [accounting examples](research/irrigation-accounting.json), checked by [a reproducible arithmetic audit](research/irrigation-accounting.py), specify a uniform assumed capacity of 0.09 inches/inch over 36 inches, giving 3.24 inches. This is an illustrative field, not a measured profile.

A base day begins at a 1.00-inch deficit, receives 0.10 inches of fully effective rain and 0.50 inches of gross irrigation with assumed 80% efficiency, and uses 0.25 inches. Net irrigation is 0.40 inches and the ending deficit is 0.75 inches. Using net irrigation and then adding the same application loss again gives the wrong 0.85-inch result. Two additional cases expose surplus water and an estimate outside the assumed available-water range; neither is silently clipped into a valid recommendation.

Readers compare an action now with a delayed action under an explicit forecast and delivery capacity. They must identify the growth-stage limit, root-zone assumptions and missing field evidence before selecting an action. The final thresholds and timing branches require agronomist review. No automatic “optimal schedule” or real location/weather input is supplied by this research brief.

State: scenario, input provenance, unit display, gross/net convention, forecast and reasoned decision. Provide a table, typed values, labelled controls and a static ledger. A field-check correction must retain both the earlier estimate and the reason for revision; it must not rewrite rainfall history. Success means conserving water in the arithmetic, counting losses once and explaining why a model result alone does not settle the field decision.

## Preparation gates and release

Before authoring, an agronomist checks the crop/stage/soil envelope, water-loss convention, finite delivery rate and answer rubric. Freeze the selected source edition and actual field protocol if introducing observations. Real reproduction and learner/access checks remain unperformed. The simplified surplus case removes excess immediately; it does not model the transient drainage described by UMN.

Use original diagrams and the original numerical exercise. No extension table, photograph, spreadsheet or ASABE-adapted definition/figure is copied into the lesson by this brief. Exact future quotations/assets and distribution need their own rights decisions. Preserve the first pilot's uncertain units and excluded conductivity/density fields; this follow-up cannot retroactively resolve them.
