# Greedy-algorithm source review — 2026-10-18

Completed **algo-10.6** and **algo-10.20**. Original dependency arrays and unrelated items are preserved. Dedicated calculation helpers are in `content/algo/greedy-audit.shared.js`; existing shared graph, independence and matroid helpers are unchanged.

## Primary sources

For scheduling, read [Kleinberg–Tardos, *Algorithm Design* (2006), §4.2](https://djvu.online/file/89ohtfonnHm6V), **pp.125–131**, including (4.7) idle removal, (4.8) equal-deadline blocks, (4.9) adjacent exchanges and (4.10) optimality, plus the release-time limitation. Cross-checked the complete argument against [Kevin Wayne's primary lecture slides](https://www.cs.princeton.edu/~wayne/kleinberg-tardos/pdf/04GreedyAlgorithmsI.pdf), **slides/PDF pp.25–32**; 52-page file, dated 2020-02-25 on slide 1, SHA-256 `cdbb5c2d4267e5a3874d8064ec93ee208f9e3078c70f23c92c56d00c7b926a02`. Rendered and inspected the exchange slide 31. The source defines nonnegative lateness; the entry explicitly uses signed lateness and shows why the same inequalities prove that version, with truncation giving maximum tardiness. The unsupported Jackson-priority year is removed.

For matroids, read [Jeff Erickson's author notes, *Matroids* (2018)](https://jeffe.cs.illinois.edu/teaching/algorithms/notes/E-matroids.pdf), **§E.1, pp.1–4**, including the full proofs of **Theorems E.1 and E.2, pp.3–4**. Eight-page PDF, SHA-256 `22f1e83b44505890ae1742dbea8c5ca37c61c842ccee45faa4922d72fb505fce`. Pages 3–4 were rendered; page 3 inspected directly. The author labels these notes a draft; the needed exchange, heredity and explicit counterexample arguments are checked independently below. Unchecked Rado/Gale/Edmonds priority years are omitted.

The conventional Edmonds–Rado name is supported by [Ferrari's author paper (2013)](https://arxiv.org/pdf/1306.3797), **Theorem 1.1, p.3**, which names both authors and states the independence-system characterization. Its poset generalization is not needed here.

## Corrections

**Scheduling.** Added the common release time, positive processing times, no-preemption/no-precedence scope, idle-removal argument and equal-deadline tie reasoning. Signed lateness and nonnegative tardiness are distinguished. The red strip marks only the processing that lies beyond the deadline: when a job also starts late, its width is less than C−d. The legend/caption now say this, while the numeric label remains the full signed lateness. The order selector initializes an order; moving jobs deliberately keeps the current order and may introduce inversions. A job edit now clears stale last-swap before/after values. Exact integer schedule rows and the actual inversion swap are tested through dedicated helpers. The independent optimum remains an exhaustive search over all 120 orders.

**Matroid characterization.** Made the finite ground set and nonnegative independent-set weights explicit, separating arbitrary-real-weight **basis** optimization. With a negative weight, adding a feasible element can reduce independent-set weight, so the unqualified all-weights wording was too broad. The proof explains why heredity makes an exchange candidate feasible when it was first scanned, and why nonnegative remaining greedy weights complete the comparison. The converse uses exact weights a+2 on A, a+1 on B\A and zero elsewhere, giving a(a+2) versus at least (a+1)²; zero-weight additions cannot close that gap. The button uses these same weights and an actual failed-exchange witness.

The readout now reports a complete finite subset/exchange check, separately from 300 seeded weight trials. A finite absence of losses is not a proof for all weights. Repeated trials are cached while the underlying system stays unchanged, so dragging weights does not repeat the same experiment. Zero vectors, collinear vectors, zero weights and tied optima remain legitimate inputs.

## Independent validation

`node --test tests/verification-algo-greedy.test.mjs`: **6 tests pass**.

- Independent last-job subset dynamic programming verifies EDF in all **3,375** three-job worlds, including negative deadlines and tied/early completions.
- All **1,024** five-job duration/deadline corners agree with that DP and **all 120 permutations** per world. All-early jobs correctly give signed maximum lateness −11 rather than zero.
- Every permutation of four five-job worlds is repeatedly exchanged: each strict adjacent swap removes exactly one inversion, never raises maximum lateness, and leaves every other job's completion time fixed.
- Independently enumerate all **167 nonempty hereditary families on four elements**. All **68 matroids** agree with exhaustive optimum for each of **625 weight vectors**. Each other family has an explicit positive-gap failed-exchange weighting. This finite enumeration checks the implementation, rather than replacing the general proof.
- Exact forest, matching and integer-vector oracles are checked, including zero-vector loops and parallel vectors; negative weights exhibit the basis/independent-set distinction.

`node tests/verification-algo-greedy.mjs`: **4 light/dark browser groups pass**. All five initial order choices; repeated inversion swaps; actual job-coordinate corners, tied negative lateness, shuffles and stale-history reset; all four independence systems, every weight endpoint, actual failed-exchange and random-weight buttons, all-zero vectors and signed vector corners. Actual bars, rows, optima, oracle certificates, runtime, TeX and blank-stage checks pass. Inspected tied-EDF light, matching dark and zero-vector light screenshots. Syntax/static and scoped whitespace checks pass.
