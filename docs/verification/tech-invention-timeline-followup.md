# Invention credits and inferred timeline years

Metadata follow-up to `0441e0a`, covering technology4.2/4.6/4.7. Only these three credit strings change. Jackson/Seymour publication years2013/2023, Jonkman2003 and Agricola1556 remain in the full references and source reports; they are removed from the invention-credit field. Neither these publications nor the dated description establishes a first invention year.

`scripts/build.mjs` derives `yr` from a paper's metadata when available, otherwise from the first eligible year in `credit`. Before this repair it therefore assigned Roman concrete to2013, the post mill to2003 and the cam/stamp invention to1556. The already committed stirrup follow-up likewise removed the modern archaeological publication year2024 from its credit.

A strict build from an isolated archive with only the changed credit files overlaid passes **6,684items/450chapters/85collections,0errors/0warnings**. Output is confined to `/tmp/atlas-worker-two/tech-timeline-build/`; log `/tmp/atlas-worker-two/tech-timeline-build.log`. Actual built-index assertions verify that4.2/4.6/4.7/4.9 have no inferred invention year, while the actual Smeaton paper4.12 retains1759. Actual built-detail assertions verify references still contain2013/2023,2003 and1556. Evidence `/tmp/atlas-worker-two/tech-timeline-assertions.log`.

No model, visualization, saved state, syllabus, shared helper/runtime or tracked generated data changes. Native behavior is unchanged, so the existing independently reviewed native evidence remains applicable.
