# INFO written cross-field prerequisites — 2026-10-20

This batch adds **16 genuine prerequisite edges across 15 written ideas**, with matching additions to the existing syllabus rows. Read-only inventory moves INFO from **9 written-to-written / 9 written-to-known / 12 whole-syllabus** to **25 / 25 / 28**, unknown targets zero. These remain provisional producer counts pending independent peer acceptance and coordinator integration. No global inventory, source record, verification flag, function, or model is changed.

## Actual proof consumption

The complete consumer statements/arguments and actual target statements/proof ideas were read. Each addition names a specific mathematical step used by the existing derivation, with bounded hypotheses rather than claiming a target proves the entire consumer theorem.

| Consumer | Added target(s) | Actual use and limits |
|---|---|---|
| 1.3 binary entropy | pma-5.15 | Taylor's theorem with interior smoothness, value 1, first derivative zero and second derivative −4/ln2 establishes the displayed local quadratic approximation and a cubic remainder bound. It is not uniform at the endpoints. |
| 1.7 entropy chain rule | prob-1.6.1 | Linearity of expectation averages the pointwise surprisal sum; finite positive-support pairs make all terms integrable. Dependence is allowed; marginal summation and conditional averaging give the two entropy terms. |
| 1.10 Rényi entropy | pma-5.13 | The actual 0/0 l'Hospital theorem applies to ln S(alpha)/[(1−alpha)ln2], with denominator derivative nonzero. Finite positive support permits differentiating the sum; zero masses are removed first. |
| 2.3 log-sum inequality | rca-3.3 | Actual Jensen on a finite probability measure with weights b/B and convex t ln t provides the averaging step, whereas the preexisting rca-3.1 supplies convexity. Zero cases follow by limits or infinite left side. |
| 2.4 cross-entropy | prob-2.2.14 | Finite-mean weak law applied to i.i.d. model log-loss gives convergence in probability of sample loss to cross-entropy. Integrability is explicit; a model excluding possible outcomes fails it. |
| 2.8 information/divergence chain rules | prob-1.6.1 | Linearity splits the joint log-ratio average into marginal and conditional sums on a finite alphabet with q positive on p support. It uses no coordinate independence. |
| 2.13 Pinsker | pma-5.11 | The actual derivative-sign monotonicity theorem turns the binary gap derivative into decrease before b=a and increase afterward, proving its minimum zero. Boundary limits and nats/bits conversion are explicit. |
| 3.1 AEP | prob-2.2.3; prob-1.6.4 | Finite-support i.i.d. surprisals satisfy the L² law with variance sigma²/n; Chebyshev applied to the squared centred average supplies the displayed quantitative probability bound. The theorem and bound consume distinct named results. |
| 3.10 Chernoff–Stein | prob-2.2.3 | Finite D on a finite alphabet gives bounded independent log-likelihood increments under P. The L² law controls both likelihood threshold events. P need not be positive outside its support. |
| 3.11 process entropy rate | pma-3.14 | Stationarity makes the conditional entropy sequence non-increasing; finite alphabet bounds it. The actual bounded-monotone theorem gives its limit, and an explicit initial-segment/tail argument gives the same Cesàro limit. |
| 3.13 graph entropy rate | stoch-4.9 | Detailed balance makes the degree-weighted law stationary by summing equal edge flows. A connected graph with an edge has positive degrees; bipartite periodicity does not obstruct stationarity or its entropy-rate formula. |
| 3.14 divergence to equilibrium | stoch-4.7 | Finite irreducible aperiodic convergence gives mu_n→pi, with pi positive. Finite-sum continuity gives D→0. Stepwise contraction remains distinct and does not require aperiodicity. |
| 3.15 Shannon–McMillan–Breiman | stoch-4.13 | The existing Markov special-case argument uses the actual Markov ergodic theorem on the chain of allowed transition pairs, with stationary weights mu_i P_ij and bounded −log P_ij reward. No aperiodicity is required for time averages. This is expressly not a proof of the full general theorem. |
| 4.4 McMillan | pma-3.20 | The actual limits k^(1/k)→1 and fixed-positive-constant kth root→1 finish S≤(k lmax)^(1/k). Infinite codes are handled through finite subcodes, with no global finite maximum-length assumption. |
| 4.14 Elias gamma code | pma-3.26 | Geometric series at ratio 1/2 sums level contributions 2^(−L−1) to the exact infinite Kraft mass 1. Unary framing separately establishes parsing. |

## Preservation and mathematical checks

A temporary explicit audit compares all **57 complete written objects**, including actual function source, refs, links, captions, statements, model/source flags, and inherited scopes. Every field is identical except the 15 append-only idea paragraphs and the exact 16 mapped deps. The complete syllabus is unchanged except those mapped additions, and all existing `.shared.js` helpers are byte-for-byte identical. Baseline and guard evidence: `/tmp/atlas-info-prereqs-evidence/{baseline.json,mapping.json,guard.mjs,guard.log,inventory.json}`. No immutable snapshot assertion is added to the default test suite.

`node tests/verification-info-prereq-audit.mjs` passes **13 independent mathematical groups** without production helper imports. They check the interior Taylor remainder, dependent/zero-cell entropy chain identities, finite-support Rényi limit, unnormalized Jensen/log-sum, exact Bernoulli sample-loss variance and Chebyshev tails, KL chain identity, Pinsker gap/sign/boundary p cases, finite testing likelihood increments including omitted P support, exact stationary hidden-Markov block entropies and their conditional monotonicity, detailed balance/rate identities on **all 771 connected simple graphs on 2–5 vertices**, equilibrium contraction/convergence and a periodic counterexample, allowed-pair stationary law/additive log-likelihood, finite McMillan power counts and the infinite gamma-code sum's partial-sum identity. These are independent examples/identities supporting the actual derivation steps, not a claimed numerical proof of general ergodic theorems.

## Native text and strict checks

`INFO_PREREQ_OUTPUT=<own-directory> node tests/verification-info-prereq-prose.mjs` passes **30 fresh native mounted pages**, all 15 changed ideas at **320px in light and dark**. Runtime/TeX/blank checks, actual idea scroll bounds and all rendered TeX rectangles pass. Complete ideas are captured; all separately captured appended paragraphs were inspected in both themes, with readable equations/prose and no clipping. The text isolation happens after native mounting checks and keeps the 284px content width. Evidence: `/tmp/atlas-info-prereqs-evidence/native/` and `native.log`. This checks changed text and native mounting, not all inherited controls or source certification.

Strict build: **6684 written + 6890 planned, 450 chapters, 85 collections; 0 errors, 0 warnings**, home **112741 bytes gzip**. INFO static: **57 items, 0 errors, 0 warnings**. Logs: `/tmp/atlas-info-prereqs-evidence/{math,build,static}.log`.

## Bridge assessment

The actual changed-ID bridge search finds only `content/bridges/entropy.js` → info-3.14. Its original stationarity/contraction step is compatible with the new convergence qualification, but its ending “for any random process” is broader than the actual common-Markov-channel hypothesis. This was reported to the coordinator for a bounded bridge correction. The coordinator reports separate commit **be2bdb2** narrowing the note to two laws under the same Markov transition and distinguishing ordinary entropy from divergence; that separate bridge commit requires its own independent review/native narrow-theme check and is not part of this candidate. No bridge file is edited here.
