# EPI raw metadata and censoring followup — 2026-10-20

This separately authorized followup resolves the independent peer's bounded findings on original prerequisite candidate **a13604f7bae12f3718d28fe089c18e4957e790d3**. It adds **no prerequisite edge credit** and changes no function, model, source flag, statement, caption or scope. Read-only EPI counts remain **25 written-to-written / 26 written-to-known / 44 whole-syllabus**, unknown zero.

Three raw syllabus lists are synchronized to the existing written lists:

| Item | Prior candidate syllabus | Corrected syllabus, equal to unchanged raw written item |
|---|---|---|
| 1.5 | `[epi-1.1, epi-1.2, pma-5.15, pma-6.21]` | `[epi-1.1, epi-1.2, pma-8.6, pma-5.15, pma-6.21]` |
| 1.8 | `[epi-1.7, prob-1.6.1]` | `[demo-1.7, epi-1.2, prob-1.6.1]` |
| 4.6 | `[epi-4.1, causal-3.5, causal-4.3]` | `[causal-1.1, causal-3.5, causal-4.3]` |

Actual 1.5 solves S′=−lambda S using the already-written pma-8.6 exponential input. Actual 1.8 uses reference rates times person-time (epi-1.2) and explicitly contrasts direct standardization (demo-1.7); epi-1.7 is already an alias of demo-1.7. Actual 4.6 uses causal-1.1; epi-4.1 is its alias. These synchronize existing uses, rather than manufacture quota inputs. Raw 2.7 already uses `[epi-2.5, pma-5.8]` in both full item and row, with epi-2.5 an alias of stat-6.5; no content change is needed there. The original report had mixed loader-normalized stat-6.5 with the raw alias and is corrected. Its full before/after dependency table now reflects these explicit row corrections and raw 2.7 correctly.

The only changed written prose is a literal qualification in the retained 3.9 argument: **“whatever the censoring” → “under non-informative censoring that preserves this hazard in the observed at-risk process.”** The original expected-event/person-time identity needs that maintained-intensity assumption and otherwise conflicts with the new paragraph's existing limits on dependent observation processes. For X exponential with rate lambda and a fixed independent censor C=c, E[d]=1−exp(−lambda c)=lambda∫₀ᶜexp(−lambda t)dt=lambda E[T]. But if a censor uses future event time, C=X/2, no event is observed while lambda E[T]=1/2. This narrows the claim and makes no new biomedical efficacy assertion.

## Independent verification and preservation

The temporary explicit guard `/tmp/atlas-epi-metadata-followup/guard.mjs` compares all **47 raw complete item objects**, actual function source and every flag against an archive of a13604f7. Only the exact 3.9 phrase replacement is allowed. The complete raw syllabus permits only the three exact arrays above, each checked against its raw full item; raw 2.7 equality is checked separately. Shared helpers, source-audit module and collection metadata remain byte-identical. Raw arrays are saved in `deps.json`; guard output and archived baseline are in that directory. This guard is explicit-only, not added to default tests.

`node tests/verification-epi-censoring-qualification.mjs` passes **9 independent fixed-censor identities and 3 informative-censor counterexamples**, without production imports. The 11 prerequisite mathematical groups and all 9 existing EPI mathematical/fixture tests also pass unchanged. This is preservation/conditional mathematical evidence, not source certification.

`EPI_PREREQ_OUTPUT=<own-directory> node tests/verification-epi-censoring-prose.mjs` mounts 3.9 freshly at **320px in both themes**, checks clean native runtime/TeX/blank lists, and verifies actual idea scroll/TeX bounds. Both entire ideas and the specifically changed first paragraph are captured. I personally inspected both changed-paragraph images: the non-informative/observed-hazard qualification is visible and all prose/equations fit. Evidence: `/tmp/atlas-epi-metadata-followup/native/` and `native.log`. The independent peer will separately review the exact correction archive and actual built proof.

Fresh strict build: **6684 written / 6890 planned / 450 chapters / 85 collections; 0 errors/warnings**, home **112759 bytes gzip**. EPI static: **47 items, 0 errors/warnings**. Logs and baseline evidence: `/tmp/atlas-epi-metadata-followup/{guard,math,prereq-math,existing-math,build,static,native}.log`. All browser jobs are closed. No bridge, runtime, global inventory, source closure, flags or queue files are edited.
