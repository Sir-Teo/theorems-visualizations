# Combined verification checkpoint through 2c2145f

October 19, 2026. This snapshot adds the independently reviewed Bachelier,
efficiency-benchmark, exchange-core and dominant-firm audits. The isolated
persistent-scene renderer remains unimported and outside the default test glob;
production map rendering is unchanged.

- `npm test`: **1,453 tests pass**, with no failures, cancellations or skips,
  including all six UI tests.
- `node scripts/build.mjs --strict`: **6,684 written + 6,890 planned items**,
  450 chapters and 85 collections; zero errors or warnings. Home JSON is
  **112,805 bytes gzipped**, below the 300,000-byte ceiling.
- `node scripts/check.mjs --static`: **6,621 items**, zero errors or warnings.
- The changed-page smoke subset passes **53 valid routes**, zero runtime errors.
  It extends the preceding 48 with fin-5.1/5.13/5.14 and micro-9.4/10.20.
  Every item resolves to its actual title. This does not repeat the earlier
  complete route inventory.
- The source ledger reconciles **186 pending = 833 initial + 3 added − 650
  original resolved**. No human review or subjective listening is required.
- The regenerated cross-field inventory passes its counting regression in the
  full suite. Published shortfall is **871**: 54 of 64 collections remain below
  25 published edges, and 27 remain below 25 over their complete syllabi.
  Three genuine written inputs are used: the measurable-factor conditional
  expectation rule in both efficiency entries, and the heat kernel in Bachelier.

The five source closures add **17 mathematical groups and 20 native groups**.
Source comparisons and final screenshot inspection are documented in the
[Bachelier](fin-bachelier-followup.md),
[efficiency](fin-efficiency-followup.md) and
[core/fringe](micro-core-fringe-followup.md) reports. The root-authored efficiency
changes also received a separate agent's primary-source, mathematical and data
review. All 23,477 fresh daily/monthly source values and the actual daily calendar
match the embedded inputs. Non-target neighboring item bodies were checked
byte-for-byte.

The full-map 60 fps, remaining source, cross-field and proof-curation work stays
open. The persistent-scene experiment regressed its bounded matched timing run
and is excluded from production. Its explicit correctness checks and measurements
are separate evidence, not part of the 1,453-test default count. Automated audio
remains 53 items / 95 actions. Wave 5 remains prepared and unstarted.

Logs: `/tmp/atlas-checkpoint-source650-{tests,build,static,smoke}.log`,
`/tmp/atlas-cross-field-source650.log` and the source-specific evidence in the
individual reports. The source650 label identifies the 650 resolved original
flags; the corresponding Git checkpoint is 2c2145f.
