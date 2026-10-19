# Independent peer review of the probability prerequisite audit

Reviewed the original 133 proposed edges across ML, deep learning, causality, computation, complexity, cryptography and programming languages. Every target name and existing-prose anchor was screened. The detailed sample reads **50 source items and 75 original edges** across all seven collections, including the suspicious logical, algebraic and graph targets. This checks prerequisite semantics; it does not repeat primary-source verification or certify every theorem claim.

One correction was required and is complete: `cplx-2.9 → graph-5.1.1` supported only the four-color contrast sentence. The owning reviewer removed it from content and syllabus `deps` and retained it in both `see` lists. The canonical target still exists. The final audit therefore contains **132 additions**, and CPLX has 28 qualifying edges.

|Collection|Detailed original edges read|
|---|---:|
|ml|9|
|deep|8|
|causal|15|
|toc|8|
|cplx|17|
|crypto|10|
|pl|8|

## Target semantics

The potentially misleading names resolve correctly: `logic-1.3` is the actual Schröder–Bernstein theorem; `logic-4.1/4.2` are modus ponens and the deduction theorem used in Curry's argument; `graph-5.5.1a` explicitly contains the clique/independent-set complement identity despite its perfect-graph title; `alg-3.22` supplies cancellation in the XOR additive group. The conditional-law targets used in the sampled causal examples have finite binary outcomes/blocks, within their nice-space scope. The ML noisy-label definition appropriately uses conditional expectation rather than imposing a regular-kernel hypothesis on arbitrary learning domains.

## Transitivity

After the four-color correction,24 retained additions have another dependency path. Each was checked against its local derivation rather than deleted mechanically. For example, Xavier initialization needs both variance additivity across summands and product-moment factorization inside each summand; IPW explicitly uses both taking out a measurable factor and the final tower step; the finite-automaton proof invokes matrix path counts, Cayley–Hamilton and rational-generating-function equivalence. The source explicitly uses these operations. By contrast the removed four-color result had no role in its local hardness proof. Every alternative path and its local-role disposition is recorded in the JSON.

## Validation

All 132 final additions are unique directed edges with written endpoints in different registered fields. Every edge is present in content; all full dependency arrays match their syllabus items; target titles match the live registry; all recorded source-anchor quotations match the actual source field. The full written-plus-planned graph has 13661 nodes and zero cycles. The independent scoped static check passes for 325 items with zero errors and warnings. The four-color removal and retained see-links were independently verified.

No probability-owned content was edited by this peer reviewer. No quota additions, source-flag changes or heavy browser/OCR runs were made. The exact 75-edge sample, source/target files, per-item judgments and 24 alternative paths are in `cross-field-peer-review-climate.json`.
