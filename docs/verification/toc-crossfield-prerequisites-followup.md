# TOC genuine cross-field prerequisites — 2026-10-20

This producer adds **18 genuine prerequisite edges across 18 existing written items**, bringing read-only TOC inventory **7 written-to-written / 9 written-to-known / 17 whole-syllabus → 25 / 27 / 35**, unknown zero. These remain candidate counts until independent acceptance/coordinator integration. No source-closure, source flag or global inventory is edited. The additions explicitly consume finite counting, induction, normal-form, division, composition and quotient results in existing arguments; they do not import unrelated topics to fill a quota.

## Actual target proofs and consumer use

The complete actual target statements/proof ideas and consuming statements/arguments were read. Ten distinct authored targets support these steps:

| Consumer | Added target | Existing calculation or proof step, with limits |
|---|---|---|
| 1.1 strings | comb-1.1 | Product rule for n ordered symbol choices gives k^n; prefix boundaries number n+1. This is finite choice counting, not probabilistic independence. |
| 1.2 language operations | comb-1.1 | Finite Cartesian-pair count bounds the image under concatenation; ambiguity of splitting can make the inequality strict. Union's additive rule requires disjointness. |
| 1.7 string induction | alg-2.1 | Ordinary induction is applied to the all-words-of-length-n proposition, using unique last-symbol decomposition; one example per length is insufficient. |
| 1.9 satisfiability | logic-2.5 | Actual canonical CNF theorem constructs one false-row clause per falsifying assignment, proving exact truth-table equivalence with exponential size permitted. Tautologies use an empty conjunction or explicit tautology. |
| 2.4 remainder automaton | alg-2.9 | Unique division remainder and x=kq+r imply the MSB-first update (2r+b) mod k for positive k; prefix induction establishes the invariant. |
| 2.6 product automaton | alg-1.4a | Ordered-pair equality/finite grid supplies product-state memory and its cardinality; coordinatewise total transitions preserve the pair-of-runs invariant. |
| 2.11 reset words | alg-1.15 | Word actions compose functions associatively; permutation letters compose to a bijection and cannot reset a multi-state set. Equal token positions remain equal after later functions. |
| 3.3 determinization | comb-1.1 | Binary include/exclude choices count the full 2^n subset universe, including empty set; reachable subsets may be fewer. |
| 3.4 blow-up | comb-1.2 | Pigeonhole places two of the 2^k prefixes in one state if fewer states exist, contradicting the actual distinguishing suffix. This is a worst-case proof, not a finite graph's extrapolation. |
| 3.6 regex semantics | alg-2.5 | Strong induction on syntax-tree size supplies meanings of all smaller children before applying the root constructor; finite syntax may denote an infinite starred language. |
| 3.7 Thompson | alg-2.5 | Strong induction proves constructor correctness and the 2m state bound from two-state leaves, union/star additions and concatenation boundary identification. No minimality claim. |
| 3.8 elimination | alg-2.1 | Induction over the eliminated-state set preserves path-label languages: entry, repeated returns and exit give the update. It does not imply polynomial expression size. |
| 3.10 Arden | alg-2.1 | Induction justifies repeated substitution at each finite k; epsilon-free A gives minimum factor length one, so k=m+1 excludes the remainder term for any fixed length-m word, proving uniqueness. |
| 4.4 Nerode relation | alg-1.20a | Reflexivity/symmetry/transitivity are checked by equality of suffix-membership truth values. Right congruence is an additional concatenation consequence, not an arbitrary equivalence axiom. |
| 4.5 Nerode theorem | alg-1.25 | Actual class/partition correspondence gives nonempty disjoint quotient states. Right congruence makes representative transitions well defined; empty suffix makes acceptance constant. Finite index is separately required. |
| 4.6 minimal uniqueness | alg-1.15 | Composing one canonical-class bijection with the inverse of the other gives the structure-preserving state isomorphism, not merely equal state counts. |
| 4.7 refinement | alg-1.25 | Nonempty blocks induce an equivalence relation; splitting by signatures retains a partition and stable successor blocks give representative-independent quotient transitions. |
| 4.11 two-way simulation | comb-1.1 | The halting deterministic crossing-sequence argument counts finitely many bounded boundary records and finitely many boundary-behavior tables. This is only the finite-counting step, not an optimal bound or an independent nondeterministic simulation proof. |

## Explicit bounded corrections and raw-list repairs

Three touched mathematical wording issues are corrected, without function/model changes:

- 2.11's permutation obstruction now requires **more than one state**; a one-state DFA is already synchronized by the empty word.
- 3.7 no longer claims that no fragment state gains an arrow. It distinguishes the designated start/final boundaries, which are connected or identified, from retained internal transitions.
- 4.7 starts with the **nonempty blocks** of `{F,Q\F}`. Otherwise empty/all-accepting machines would start with a set that is not a partition under the actual algebra definition. Empty/all-accepting cases are included in the independent finite audit.

Two omitted existing same-field inputs are backfilled in raw syllabus rows, with **no cross-field credit**: 2.7 becomes `[toc-2.3, algo-8.4]` to match its written BFS/reachability argument; 4.9 becomes `[toc-4.1, toc-4.5, toc-2.6]` to match the written alternative intersection proof. Both actual existing target arguments were read. Every other syllabus field is preserved. No alias is silently normalized away.

Every added edge's complete raw written/syllabus arrays are listed below. All **51 raw full-item/row lists** now agree exactly.

| Item | Raw full item before → after | Raw syllabus before → after |
|---|---|---|
| 1.1 | `[]` → `[comb-1.1]` | `[]` → `[comb-1.1]` |
| 1.2 | `[toc-1.1]` → `[toc-1.1, comb-1.1]` | `[toc-1.1]` → `[toc-1.1, comb-1.1]` |
| 1.7 | `[toc-1.1]` → `[toc-1.1, alg-2.1]` | `[toc-1.1]` → `[toc-1.1, alg-2.1]` |
| 1.9 | `[logic-2.3]` → `[logic-2.3, logic-2.5]` | `[logic-2.3]` → `[logic-2.3, logic-2.5]` |
| 2.11 | `[toc-2.2]` → `[toc-2.2, alg-1.15]` | `[toc-2.2]` → `[toc-2.2, alg-1.15]` |
| 2.4 | `[toc-2.1]` → `[toc-2.1, alg-2.9]` | `[toc-2.1]` → `[toc-2.1, alg-2.9]` |
| 2.6 | `[toc-2.3]` → `[toc-2.3, alg-1.4a]` | `[toc-2.3]` → `[toc-2.3, alg-1.4a]` |
| 3.10 | `[toc-3.6]` → `[toc-3.6, alg-2.1]` | `[toc-3.6]` → `[toc-3.6, alg-2.1]` |
| 3.3 | `[toc-3.2, toc-2.3]` → `[toc-3.2, toc-2.3, comb-1.1]` | `[toc-3.2, toc-2.3]` → `[toc-3.2, toc-2.3, comb-1.1]` |
| 3.4 | `[toc-3.3]` → `[toc-3.3, comb-1.2]` | `[toc-3.3]` → `[toc-3.3, comb-1.2]` |
| 3.6 | `[toc-1.2]` → `[toc-1.2, alg-2.5]` | `[toc-1.2]` → `[toc-1.2, alg-2.5]` |
| 3.7 | `[toc-3.5, toc-3.6]` → `[toc-3.5, toc-3.6, alg-2.5]` | `[toc-3.5, toc-3.6]` → `[toc-3.5, toc-3.6, alg-2.5]` |
| 3.8 | `[toc-3.1, toc-3.6]` → `[toc-3.1, toc-3.6, alg-2.1]` | `[toc-3.1, toc-3.6]` → `[toc-3.1, toc-3.6, alg-2.1]` |
| 4.6 | `[toc-4.5]` → `[toc-4.5, alg-1.15]` | `[toc-4.5]` → `[toc-4.5, alg-1.15]` |
| 4.7 | `[toc-4.6]` → `[toc-4.6, alg-1.25]` | `[toc-4.6]` → `[toc-4.6, alg-1.25]` |
| 4.11 | `[toc-4.5, toc-2.1]` → `[toc-4.5, toc-2.1, comb-1.1]` | `[toc-4.5, toc-2.1]` → `[toc-4.5, toc-2.1, comb-1.1]` |
| 4.4 | `[toc-2.3]` → `[toc-2.3, alg-1.20a]` | `[toc-2.3]` → `[toc-2.3, alg-1.20a]` |
| 4.5 | `[toc-4.4, toc-2.2]` → `[toc-4.4, toc-2.2, alg-1.25]` | `[toc-4.4, toc-2.2]` → `[toc-4.4, toc-2.2, alg-1.25]` |

## Preservation, independent mathematics and native proof/statement checks

Temporary explicit audit `/tmp/atlas-toc-prereqs-evidence/guard.mjs` compares all **51 raw complete item objects**, including actual function source, flags and every other field. Only the exact appended ideas/deps, two bounded existing-idea corrections, one nonempty-block statement correction and two equivalent statement wraps are permitted. The whole raw syllabus permits only the declared new edges and two justified existing omissions. All 51 raw full item/row lists match. Every shared helper, `automata.audit.js`, collection metadata and other nonchapter file is byte-identical. Baseline archive, mapping, exact wrap replacements and raw dependency arrays are in that temporary evidence directory; no default snapshot test is introduced.

Two touched inherited statements needed equivalent layout changes at actual built 320px: 2.6's product transition displayed equation had 7px internal overflow, so it now defines the two next-state coordinates and then the same ordered-pair transition on separate lines; 3.4's long inline set-builder overflowed by about 107px, so the identical binary-language condition is written as prose with its minimum word length explicit. The original positive-k hypothesis and NFA/DFA state bounds are unchanged. No global CSS/runtime change is used.

`node tests/verification-toc-prereq-audit.mjs` passes **11 independent finite mathematical groups**, without production helper imports. These include product/concatenation counts; recursive reversal identities; every Boolean function through three variables against its canonical CNF; division/remainder prefix invariants; product runs/permutation composition; all 256 two-state binary NFAs against explicit path enumeration and all distinguishing-prefix pairs through k=5; **411 syntax trees** with smaller-child recursion/state counts; looped generalized-state elimination against exact bounded-word path languages; Arden finite fixed-point/length witnesses including the two-solution epsilon example; **5896 complete two/three-state binary DFAs** against exhaustive suffix signatures, nonempty partition refinement and quotient language identities, including empty/all-accepting cases; and the finite crossing-record count. They are independent witnesses supplementing the read proofs, not finite-sample proofs of infinite-language statements.

All **10 existing TOC automata default tests pass** unchanged. Final strict build: **6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors/warnings**, home **112769 bytes gzip**. Scoped static: **51 items, 0 errors/warnings**. The audit's initial local fixture had a duplicate JavaScript constant name; that test-only syntax issue was corrected without a production formula change.

`TOC_PREREQ_OUTPUT=<own-directory> node tests/verification-toc-prereq-prose.mjs` passes **36 native mounts** and separate actual built **36 statement + 36 proof views**, all 18 touched items at **320px, light/dark**. Native runtime/TeX/blank lists are clean. Every statement/proof's own scroll bounds, each displayed math's internal scroll bounds and every rendered TeX rectangle fit after the two equivalent wraps. Complete statements/ideas and separate added/corrected paragraphs were captured at a 2400px-tall viewport with the same 320px width. I personally inspected all **36 appended paragraphs, 36 full statement images and four corrected-prefix images** in both themes; changed text and formulas are readable and unclipped. The initial native fixture used a harness-only statement selector on the built route; switching the test to the actual production `.statement` selector corrected that test-only timeout. This validates changed text/native mounts, not every inherited control/replay behavior or historical source claim.

Actual changed-ID bridge search finds **no affected TOC bridge reference**; no bridge update is needed or made. Evidence: `/tmp/atlas-toc-prereqs-evidence/{baseline,mapping.json,deps.json,wraps.json,guard.log,math.log,existing-math.log,build.log,static.log,native-final.log,native/}`. All browser/server jobs are closed. No source flag, source closure, global inventory, ledger, queue, helper or runtime is edited. Separate immutable peer acceptance is required.
