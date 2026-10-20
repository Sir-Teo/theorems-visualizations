# CIRC touched syllabus rows — narrow metadata follow-up

Independent reviewer `thermo_prereqs` identified two omissions in the **already touched** CIRC syllabus rows. The coordinator authorized synchronizing these rows after the prerequisite and statement boundaries. I reread the actual consumer and prerequisite arguments before editing. This metadata-only successor preserves `1a6f054a6b1bf6b02af7851f0e0a50be0dfc2118` and `f29bbcb3310a654cb63e4156632ae1d693b99483` as separate immutable boundaries.

Exact full raw dependency lists:

| Row | Previous syllabus list | Corrected syllabus list = unchanged written item list |
| --- | --- | --- |
| 3.1 | `['circ-2.5', 'ladr-3.63']` | `['circ-2.5', 'circ-2.9', 'ladr-3.63']` |
| 3.7 | `['circ-3.6', 'ladr-7.5']` | `['circ-3.6', 'circ-2.8', 'ladr-7.5']` |

For **3.1**, the original source-superposition proof explicitly uses the invertibility of the grounded conductance matrix supplied by **2.9**, before applying inverse linearity. The actual 2.9 argument uses positive conductances, connected grounding and the zero-energy implication to obtain an invertible map. Its edge was already present in the complete written item and missing only from its syllabus row.

For **3.7**, the original reciprocity proof explicitly uses the symmetric conductance matrix supplied by **2.8**, before applying inverse-adjoint symmetry. The actual 2.8 argument assembles A diag(g) Aᵀ and the corresponding resistor current sums. This edge too was already present in the complete written item and missing only from its syllabus row.

No written dependency, proof, statement, caption, scope, function, source flag or helper changes. Only these two raw row arrays change, in place and in the same order as the written lists. The earlier `circ-prerequisites-evidence.json` remains an honest record of its pre-follow-up immutable boundary; the table above and `tests/circ-row-sync-baseline.json` record this separate correction rather than retroactively rewriting those earlier raw observations.

There are **no additional quota edges**: both are same-field CIRC links already present in the written graph. The provisional crossfield result remains **25 written-to-written / 39 written-to-known / 57 whole syllabus**. No global inventory edit or source closure.

Validation: `node tests/verification-circ-row-sync.mjs` verifies the exact full two rows against the unchanged actual written items; reverting just those two array spans reconstructs the complete previous syllabus source hash. Every other CIRC source/helper file is byte-identical, preserving all 56 complete items and source flags. A separate immutable baseline build demonstrates that **all generated index semantics are identical**, apart from its build timestamp; generated planned/CIRC detail files are byte-identical. Consequently no rendered content or graph membership changes, and no new native-layout claim is needed for this metadata-only correction. Strict build **0 errors / 0 warnings**, home **112706 gzip bytes**; static **2 / 0 / 0**. Evidence: `/tmp/atlas-new-circ-row-sync/evidence`, with baseline at `/tmp/atlas-new-circ-row-sync/baseline`.

Other inherited alignment observations at rows 2.15/3.4/3.5/4.3/4.7 are **left untouched and unendorsed here**; synchronizing them requires their own actual proof/target justification, not a mechanical full-list copy. CIRC 4.17 remains byte-identical and historical-source-open. BIGHIST remains frozen.
