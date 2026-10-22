# P05 · What does a soil-water curve actually measure?

**Research brief · 2026-10-22 · D10 / D06 / D02 · researched, not authored or accepted.**

Compare measured soil-water retention from a single research site with a deliberately separate, simplified water-storage model. Readers should identify an observation, a transformation and an assumption. The pilot does not prescribe irrigation or claim that one Wisconsin site represents all soils or agricultural knowledge.

## Sources and dataset audit

- **`fao-soil`:** [FAO irrigation introduction, chapter 2](https://www.fao.org/4/r4082e/r4082e03.htm), soil-water and available-water sections. Conceptual background is distinct from site measurements.
- **`ars-reesh`:** [USDA ARS publication record](https://www.ars.usda.gov/research/publications/publication/?seqNo115=431880) identifies *ReESH_US-DFC: US Dairy Forage Research Center, Prairie du Sac*.
- **`reesh-data`:** [versioned dataset DOI](https://doi.org/10.5281/zenodo.18273606); [readable metadata/API](https://zenodo.org/api/records/18273606). Metadata and both CSV files were inspected; source checksums matched. CC BY 4.0 is declared. Exact file URLs and SHA-256 values are in [the receipts](../coverage/sources.json).

The snapshot has **12 sample records and 1,106 retention rows**, sampled May 29, 2025, at depths 0, 10 and 50 cm. Each retention sample joins to one characteristics record; no exact duplicate retention rows were found. These are repeated measurements within samples, not 1,106 independent field samples.

Two issues constrain use. Metadata calls density “g m^-3” but values range approximately 0.859–1.691: the unit conflict must not be silently corrected. Also **10/12 conductivity records** carry caution flag 1. That flag concerns conductivity; it does not automatically invalidate every retention value. Exclude density-derived calculations and conductivity comparisons from the pilot. Water content is percent; the positive `MPa_Abs` values must be labeled suction/water-potential magnitude, with the sign convention explained. See the [reproducible audit](research/soil-quality.py) and [results](research/soil-quality.json).

## Reader task and exploration

Audience: general readers with inline definitions of soil sample, water content, pressure and percent.

Select a sample and see its observed points, sample/depth metadata, and instrument provenance. Compare another sample without implying a controlled causal experiment. Readers identify where the data end and explain why averaging every row equally would confuse sampling density with replication. Interpolation, if later approved, must be a separate toggle with its own description; fitting is not part of this brief.

A second, explicitly **synthetic** model uses volumetric fractions 0.30 and 0.15 over 0.40 m root depth: their difference implies 60 mm of stored water under the stated uniform-layer assumptions. These values are not inferred field capacity or wilting point from the dataset. No site recommendation follows.

State: sample IDs, displayed measurements, units, optional model parameters and assumption notes. Keep observed values visually and semantically distinct from the model.

## Acceptance checks and access

1. Freeze file hashes, column meanings, join cardinality and units. Reject missing/nonfinite values; retain instrument labels. Never count repeated curve points as independent samples.
2. A soil scientist approves magnitude conventions and the permitted subset; unresolved density and conductivity fields stay excluded.
3. Check percent-to-fraction and metre-to-millimetre conversions independently, including the 60 mm synthetic example.
4. Readers distinguish a measurement from an assumed model threshold and explain a limit to transfer between sites.

Provide data tables, typed numeric inputs, keyboard point/sample selection, non-color measured/model labels, readable log-axis alternatives if used, and a complete static explanation. No drag-only chart or dependence on a live API.

## Rights, review and next steps

Attribute dataset authors, title, DOI, licence, snapshot and transformations. Freeze a permitted small data subset only during authoring; no source CSV is bundled by this brief. FAO illustrations are not cleared for reuse; use original diagrams.

**Review roles:** soil scientist/agronomist, data reviewer, accessibility reviewer; all unassigned. The narrower observed-data design is feasible, but unit interpretation and sample-selection review remain publication gates. No publisher contact has been sent.

**Existing connections:** `geol`, `climate`, `stat` and `ecol` are optional routes; select exact accepted lessons later.

**Three-lesson sequence:** retention measurements → a separately sourced local crop/soil decision with explicit constraints → food-system or farming-practice comparison in another region, including situated knowledge where authorized.
