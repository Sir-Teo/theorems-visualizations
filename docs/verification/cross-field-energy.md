# Cross-field prerequisite audit: physics, materials and energy

Added 172 direct written-to-written prerequisite edges across 162 items, with matching syllabus dependencies. Ten of the eleven collections reach the master plan threshold of 25; relativity remains at 14, an honest shortfall of 11.

Counts use the registered field of each written endpoint, not the collection prefix. Same-field links, see-links, planned targets and duplicate edges do not count. No statement, derivation claim, numerical model or source flag was changed in this batch.

| Collection | Before | Added | After | Shortfall |
|---|---:|---:|---:|---:|
| waves | 12 | 13 | 25 | 0 |
| thermo | 14 | 11 | 25 | 0 |
| cm | 7 | 20 | 27 | 0 |
| qinfo | 6 | 19 | 25 | 0 |
| rel | 7 | 7 | 14 | 11 |
| fluid | 20 | 5 | 25 | 0 |
| xtal | 2 | 24 | 26 | 0 |
| mat | 3 | 24 | 27 | 0 |
| energy | 14 | 14 | 28 | 0 |
| solid | 9 | 18 | 27 | 0 |
| aero | 10 | 17 | 27 | 0 |

Every addition, exact pre-existing claim excerpt, target title and both source paths appears in [cross-field-energy.json](cross-field-energy.json). The audit links actual proof operations (Taylor expansion, spectral decomposition, Fourier orthogonality, Poisson formulation, counting, projection and energy balances) and definitions needed to formulate the statements. A dependency already reachable through a remote foundational chain was retained only when the local statement or derivation directly uses that result. Adjacent merely inherited prerequisites and analogy/implementation-only candidates were removed; the JSON records representative exclusions.

Relativity was read in full at the statement/idea level. Its seven supported new edges cover proper-time decay, linear boosts, the Lorentz subgroup test, polar decomposition of non-collinear boosts, the proper-time chain rule, the separable rocket equation, and the magnetic rotation equation. Its remaining derivations use same-field results already present; the audit does not create additional prerequisites to fill the numerical shortfall.

Validation: all 172 endpoints are written and have different registered fields; all syllabus mirrors match. Global dependency cycle validation reports zero cycles. Scoped static validation covers 557 items with zero errors and zero warnings. No browser launch was needed for this metadata-only batch.

A pre-existing concurrence-formula error in qinfo-2.8 was reported separately to root and omitted from the candidate SVD edge. Its source-backed correction and numerical/native checks are a separate follow-up, not a prerequisite-count justification.

Independent semantic peer review removed the axial-bar-energy and fourth-order-Frobenius candidates and refined the trajectory, simply-connected-potential and local-curvature targets to their exact hypotheses. The final ledger contains **172** additions; no missing generalization was invented to replace the removed links. The separate qinfo follow-up also made BB84's already implemented independent per-qubit interception assumption explicit, as required for its detection-probability product rule.
