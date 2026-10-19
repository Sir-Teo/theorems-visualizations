# Probability source verification — 18 October 2026

All **94** previously flagged probability items in chapters 1–5 were checked against Rick Durrett, *Probability: Theory and Examples*, version 5, 11 January 2019. Their source checks are closed; no probability `verify: true` flags remain. Definitions with letter suffixes are editorial anchors for unnumbered definitions, not printed theorem numbers.

Source: [author-hosted full PDF](https://math.duke.edu/~rtd/PTE/PTE5_011119.pdf), downloaded from the equivalent `services.math.duke.edu` address and read locally with `pdftotext -layout`. The PDF is 490 pages, 2,195,717 bytes; SHA-256 `aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`. Page numbers below are printed pages; add eight for a one-based PDF page number. Complete relevant pages and proofs were consulted, rather than search snippets. Item `refs` and source links preserve the edition and locations.

The review corrected these substantive issues:

- **M/G/1 (5.1.5):** Durrett observes customers waiting at service entry, excluding the one in service. The recurrence is `(X+A−1)^+`; the mean excludes the service customer, and empty-queue probability is `(1−rho)/P(A=0)`. The diagram and readout now use this embedding. Its stationary mean is also derived from first and second moment drift.
- **Chung–Fuchs (5.4.10–5.4.11):** restored the full unregularized equivalence, separated its 1969 converse from the 1951 regularized result, and removed the inference that growth between two finite cutoffs proves recurrence. That inference previously labelled the biased one-dimensional walk recurrent.
- **Cycle condition (5.5.6):** the criterion guarantees existence of a reversible measure; it does not make every stationary measure of a transient chain reversible. The biased walk's stationary counting measure is a counterexample.
- **Periodic tails (5.7.3):** recurrence suffices, while tail triviality also depends on the initial distribution. A fixed starting class can have trivial tail despite period greater than one. The proof now uses recurrent excursions and Hewitt–Savage rather than a positive-recurrent coupling argument.
- **Harris chains (5.8):** replaced a different two-stage splitting convention by the book's split and expansion kernels, including both identities, the equal-time expectation transfer, finite regeneration-set mass and expansion of stationary measures. Restored the almost-sure-access hypothesis in convergence; the source only guarantees it almost everywhere for a general Harris chain. The finite-cell demonstrations now compute the numbered book constructions. Completed-cycle occupation statistics discard a final unfinished cycle and normalize by all completed time, including visits outside the plotted window.
- **Additional chapter 1/2/4 repairs:** densities are nonnegative almost everywhere; disclosed the renewal count's one-unit shift from Durrett's convention; corrected Hewitt–Savage's bibliography year to 1956; restored the critical endpoint in 2.7.10 and the actual tilted-law proof; qualified independence in the tail application of Levy's 0–1 law; repaired the finite-p-moment argument in 4.4.4 by truncation; and stated integer/parity conventions for reflection counting.
- **Illustration honesty:** a two-point law stays lattice even when its separation contains an irrational term; lower dyadic envelopes now use exact minima for continuous targets; coupling-tail estimates carry sampling uncertainty instead of a potentially false displayed inequality. Logarithmic plotting floors and finite-path ruin censoring are disclosed. The maximal-inequality picture distinguishes its Monte Carlo curve from the true expected maximum: sampling error can put that curve above the theoretical bound at large exponents.

Durrett's 2.6.11 is an **Example**, represented as `Model` in both content and syllabus. Its defective renewal equation is now the primary statement. The existing light-tail asymptote is identified as an additional derivation from that equation and Theorem 2.6.12, with the integrals producing its constant given explicitly. Likewise, the finite-variance branching survival asymptote beyond 4.3.11 is derived from its generating-function recurrence. Neither extension is falsely attributed to the numbered source statement. Optional historical dates not supported by the inspected source were omitted; no unresolved historical claim was used to justify closing a flag.

Validation:

- `node scripts/check.mjs prob --static`: **369 items, 0 errors, 0 warnings**.
- `node tests/verification-prob.test.mjs`: **11 mathematical regressions pass**. These include an independent exact M/M/1 stationary law, explicit split matrices, epsilon=1, multi-time expectation transport, tail/cycle/access counterexamples, an analytic normal-TV benchmark, actual diagram lower envelopes, the exact full-period one-dimensional resolvent, finite-cutoff classification, and the exact critical geometric branching survival law.
- Browser verification: 88 successful item/theme cases covering 44 diagrams (all 38 original chapter 3/5 source-check diagrams plus six substantive chapter 2/4 follow-ups); zero remaining failures. Two initial resource timeouts passed targeted reruns with longer browser limits. The script uses `installBrowserAssets` and actual KaTeX 0.16.11. It exercises sliders, segmented controls, resampling and a real pointer drag in light and dark, checking exceptions, TeX errors and nonfinite readouts. Screenshots and machine results are in `/tmp/atlas-prob-shots` and `/tmp/atlas-prob-browser*.json`.

## Exact closure ledger

All rows below are closed. No assigned probability item remains unresolved.

| Item | File | Source location |
| --- | --- | --- |
| `prob-1.1.1a` | `content/prob/ch01.js` | §1.1, pp. 1–2 (probability space, sigma-field and measure definitions) |
| `prob-1.1.2a` | `content/prob/ch01.js` | §1.1, p. 3 (generated sigma-field and Borel sets) |
| `prob-1.1.4a` | `content/prob/ch01.js` | §1.1, pp. 3–4 (semialgebra, algebra and Examples 1.1.5–1.1.6) |
| `prob-1.2.1a` | `content/prob/ch01.js` | §1.2, p. 10 (random variable definition) |
| `prob-1.2.1b` | `content/prob/ch01.js` | §1.2, pp. 10–12 (law, distribution function and equality in distribution) |
| `prob-1.2.2a` | `content/prob/ch01-b.js` | §1.2, p. 12 (density and Example 1.2.3) |
| `prob-1.2.6a` | `content/prob/ch01-b.js` | §1.2, pp. 13–14 (definitions and Examples 1.2.7–1.2.9); §A.4 (Lebesgue decomposition) |
| `prob-1.3.1a` | `content/prob/ch01-b.js` | §1.3, p. 15, equation (1.3.1); Exercise 1.3.8, p. 18 |
| `prob-1.3.7a` | `content/prob/ch01-b.js` | §1.3, pp. 16–17 (almost-sure convergence and extended-valued limits) |
| `prob-1.4.1a` | `content/prob/ch01-c.js` | §1.4, pp. 18–19 (simple-function integral and representation independence) |
| `prob-1.6.1a` | `content/prob/ch01-d.js` | §1.6, pp. 28–29 (extended expectation definition) |
| `prob-1.6.9a` | `content/prob/ch01-d.js` | §1.6, pp. 32–33, equations (1.6.2)–(1.6.4); §3.3.5, pp. 140–141 (Heyde lognormal family) |
| `prob-2.1.1a` | `content/prob/ch02.js` | §2.1, pp. 43–45 (independence definitions and Theorems 2.1.1–2.1.3) |
| `prob-2.1.3a` | `content/prob/ch02.js` | §2.1, p. 45 (pairwise independence and Example 2.1.4) |
| `prob-2.1.5a` | `content/prob/ch02.js` | §2.1.1, pp. 46–47 (pi-system and lambda-system definitions) |
| `prob-2.2.1a` | `content/prob/ch02-b.js` | §2.2, p. 56 (convergence in probability definition) |
| `prob-2.2.3a` | `content/prob/ch02-b.js` | §2.2, p. 58 (i.i.d. definition); Theorem 2.1.21, p. 53; Theorem 2.2.14, p. 64 |
| `prob-2.5.1a` | `content/prob/ch02-d.js` | §2.5, p. 81 (tail field and Examples 2.5.1–2.5.2) |
| `prob-2.5.3a` | `content/prob/ch02-d.js` | §2.5, p. 82 (permutable events and exchangeable field) |
| `prob-2.5.4` | `content/prob/ch02-d.js` | Theorem 2.5.4 and proof, pp. 82–83; bibliography (Hewitt and Savage, 1956) |
| `prob-2.6.1a` | `content/prob/ch02-e.js` | §2.6, pp. 91–93 (renewal times, counting convention and renewal measure) |
| `prob-2.6.3a` | `content/prob/ch02-e.js` | §2.6, p. 93 (arithmetic and nonarithmetic distributions) |
| `prob-2.6.4a` | `content/prob/ch02-e.js` | §2.6, pp. 96–99 (renewal equation, examples and Theorem 2.6.9) |
| `prob-2.6.11` | `content/prob/ch02-e.js` | Example 2.6.11, pp. 100–101 (defective renewal equation); Theorem 2.6.12, pp. 101–103 (derived light-tail extension) |
| `prob-2.7.1a` | `content/prob/ch02-e.js` | §2.7, pp. 105–108 (moment-generating function, Lemma 2.7.2 and exponential tilts) |
| `prob-2.7.7` | `content/prob/ch02-e.js` | Theorem 2.7.7 and proof with Lemma 2.7.8, pp. 108–109 |
| `prob-2.7.9` | `content/prob/ch02-e.js` | Theorem 2.7.9 and edge discussion, p. 110 |
| `prob-2.7.10` | `content/prob/ch02-e.js` | Theorem 2.7.10 and proof, pp. 110–111; Example 2.7.6, p. 108 |
| `prob-3.2.1a` | `content/prob/ch03.js` | §3.2, p. 116 (unnumbered definition before Example 3.2.1) |
| `prob-3.3.1a` | `content/prob/ch03-b.js` | §3.3.1, pp. 125–128; Examples 3.3.3–3.3.10 |
| `prob-3.5.1a` | `content/prob/ch03-c.js` | §3.5, pp. 161–162 (definition and Theorem 3.5.2) |
| `prob-3.6.3a` | `content/prob/ch03-d.js` | §3.6.1, p. 168 (definition before Lemma 3.6.4) |
| `prob-3.7.2a` | `content/prob/ch03-d.js` | §3.7, pp. 175–176 (definition and exponential-gap construction) |
| `prob-3.8.3a` | `content/prob/ch03-e.js` | §3.8, p. 191 (definition before Theorem 3.8.8); p. 193, Exercise 3.8.5 |
| `prob-3.9.1a` | `content/prob/ch03-e.js` | §3.9, pp. 193–196 (definition, examples, Exercises 3.9.1–3.9.3) |
| `prob-4.1.1a` | `content/prob/ch04-a.js` | §4.1, pp. 205–207 (conditional expectation); Example 4.1.5, pp. 207–208 |
| `prob-4.1.8` | `content/prob/ch04-a.js` | Example 4.1.8, p. 210 (Borel sphere coordinates) |
| `prob-4.1.15a` | `content/prob/ch04-a1.js` | §4.1.3, p. 214 (regular conditional distribution definition) |
| `prob-4.1.17` | `content/prob/ch04-a1.js` | Theorem 4.1.17 and proof, pp. 214–215; Theorem 2.1.22 (nice spaces) |
| `prob-4.2.1a` | `content/prob/ch04-a1.js` | §4.2, pp. 217–218 (filtration, adaptedness and martingale definitions) |
| `prob-4.2.7a` | `content/prob/ch04-a2.js` | §4.2, pp. 219–220 (predictability and martingale transforms) |
| `prob-4.2.8a` | `content/prob/ch04-a2.js` | §4.2, p. 220 (stopping-time definition) |
| `prob-4.2.10` | `content/prob/ch04-a2.js` | Theorem 4.2.10 and proof, p. 221 |
| `prob-4.3.2` | `content/prob/ch04-m1.js` | Theorem 4.3.2 and proof, p. 225 |
| `prob-4.3.4` | `content/prob/ch04-m1.js` | Theorem 4.3.4 and proof, pp. 225–226 |
| `prob-4.3.4a` | `content/prob/ch04-m1.js` | §4.3.2, pp. 226–227 (Polya urn and general Beta limit) |
| `prob-4.3.8a` | `content/prob/ch04-m1.js` | §4.3.4, pp. 229–230 (branching-process definition) |
| `prob-4.3.11` | `content/prob/ch04-m2.js` | Theorem 4.3.11 and proof, p. 231; pgf iteration in §4.3.4 (derived finite-variance survival asymptotic) |
| `prob-4.4.2` | `content/prob/ch04-m2.js` | Theorem 4.4.2 and proof, p. 235 |
| `prob-4.4.4` | `content/prob/ch04-m2.js` | Theorem 4.4.4 and truncated-moment proof, pp. 236–237 |
| `prob-4.5.1a` | `content/prob/ch04-m3.js` | §4.5, pp. 240–241 (increasing process); Theorem 4.3.2, p. 225 |
| `prob-4.6.1a` | `content/prob/ch04-z1.js` | §4.6, pp. 243–244 (uniform integrability) |
| `prob-4.6.2` | `content/prob/ch04-z1.js` | Theorem 4.6.2 and proof, p. 245 |
| `prob-4.6.3` | `content/prob/ch04-z1.js` | Theorem 4.6.3 and proof, pp. 245–246 |
| `prob-4.6.8` | `content/prob/ch04-z1.js` | Theorem 4.6.8 and proof, p. 247 |
| `prob-4.6.9` | `content/prob/ch04-z1.js` | Theorem 4.6.9 and independent-tail application, pp. 247–248 |
| `prob-4.7.1a` | `content/prob/ch04-z2.js` | §4.7, pp. 249–250 (backwards martingales and sample averages) |
| `prob-4.7.9` | `content/prob/ch04-z2.js` | Theorem 4.7.9 and proof, pp. 253–254 (including nice-space qualification) |
| `prob-4.7.10` | `content/prob/ch04-z2.js` | Theorem 4.7.10 and discussion, pp. 254–255 |
| `prob-4.8.6` | `content/prob/ch04-z3.js` | Theorem 4.8.6 and proof, p. 257; Theorem 4.8.5, pp. 256–257 |
| `prob-4.9.1` | `content/prob/ch04-z3.js` | Theorem 4.9.1 and proof, p. 263 |
| `prob-4.9.5` | `content/prob/ch04-z4.js` | Theorem 4.9.5 and proof with Lemma 4.9.4, pp. 265–266 |
| `prob-4.9.6` | `content/prob/ch04-z4.js` | Theorem 4.9.6 and proof, pp. 266–267 |
| `prob-5.1.1a` | `content/prob/ch05-a.js` | §5.1, p. 269; §5.2, p. 273 (general-space definition) |
| `prob-5.1.3` | `content/prob/ch05-a.js` | Example 5.1.3, p. 270; Example 5.5.3, pp. 300–301 |
| `prob-5.1.4` | `content/prob/ch05-a.js` | Example 5.1.4, pp. 270–271; Exercise 5.2.9, p. 280 |
| `prob-5.1.5` | `content/prob/ch05-a.js` | Example 5.1.5 and equation (5.1.1), pp. 271–272; stationary mean from first and second moment drift |
| `prob-5.2.2` | `content/prob/ch05-a.js` | Theorem 5.2.2 and proof, p. 275 |
| `prob-5.2.7` | `content/prob/ch05-a.js` | Theorem 5.2.7 and proof, pp. 278–279 |
| `prob-5.3.1a` | `content/prob/ch05-a2.js` | §5.3, pp. 281–282; equation (5.3.1) |
| `prob-5.3.2a` | `content/prob/ch05-a2.js` | §5.3, p. 282 (definitions before Theorem 5.3.3) |
| `prob-5.4.4` | `content/prob/ch05-m.js` | Theorem 5.4.4 and proof, pp. 289–290 |
| `prob-5.4.5` | `content/prob/ch05-m.js` | Lemma 5.4.5 and proof, p. 291 |
| `prob-5.4.8` | `content/prob/ch05-m.js` | Theorem 5.4.8 and proof, pp. 292–293 |
| `prob-5.4.10` | `content/prob/ch05-m2.js` | Theorem 5.4.10, pp. 293–294; attribution to Ornstein and Stone (1969) |
| `prob-5.4.11` | `content/prob/ch05-m2.js` | Theorem 5.4.11, proof and Lemmas 5.4.12–5.4.13, pp. 294–296 |
| `prob-5.5.1a` | `content/prob/ch05-m3.js` | §5.5, pp. 299–300 (stationary measure definition and examples) |
| `prob-5.5.2a` | `content/prob/ch05-m3.js` | §5.5, p. 300, equation (5.5.1) |
| `prob-5.5.6` | `content/prob/ch05-m3.js` | Theorem 5.5.6 and proof, p. 302; counterexample from Example 5.5.2, p. 300 |
| `prob-5.5.11` | `content/prob/ch05-m3.js` | Theorem 5.5.11 and proof, p. 306 |
| `prob-5.5.11a` | `content/prob/ch05-m3.js` | §5.5, pp. 306–307 (definitions and Theorem 5.5.12) |
| `prob-5.6.2a` | `content/prob/ch05-z.js` | §5.6, p. 312 (definition before Example 5.6.3) |
| `prob-5.6.6` | `content/prob/ch05-z.js` | Theorem 5.6.6 and coupling proof, pp. 313–315 |
| `prob-5.7.3` | `content/prob/ch05-z.js` | Theorem 5.7.3 and proof, pp. 318–319 |
| `prob-5.8.1a` | `content/prob/ch05-z2.js` | §5.8, pp. 322–323 (Harris definition, Examples 5.8.1–5.8.3 and history) |
| `prob-5.8.4` | `content/prob/ch05-z2.js` | Lemma 5.8.4, pp. 323–324 (split-kernel construction and both identities) |
| `prob-5.8.5` | `content/prob/ch05-z2.js` | Lemma 5.8.5, p. 324 |
| `prob-5.8.6` | `content/prob/ch05-z2.js` | Lemma 5.8.6 and proof, p. 324 |
| `prob-5.8.8` | `content/prob/ch05-z2.js` | Theorem 5.8.8, Example 5.8.7 and remark, p. 325 |
| `prob-5.8.9` | `content/prob/ch05-z2.js` | Theorem 5.8.9 and proof, p. 326 |
| `prob-5.8.10` | `content/prob/ch05-z2.js` | Lemma 5.8.10 and proof, p. 326 |
| `prob-5.8.11` | `content/prob/ch05-z2.js` | Theorem 5.8.11 and proof, p. 326 |
| `prob-5.8.12` | `content/prob/ch05-z2.js` | Theorem 5.8.12, note and proof, p. 327 |
| `prob-5.8.13` | `content/prob/ch05-z2.js` | Lemma 5.8.13 and proof, p. 327 |
