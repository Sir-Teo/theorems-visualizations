# ALG 8 independent review

Status: **accepted**. All 28 frozen ALG8 items pass independent source/model review, native edge/replay checks and visual inspection. No outstanding content findings or source uncertainty flags.

Reviewer: wave5_reviewer. Review is confined to the shipping checkout. No content changes by the reviewer.

## Source checks

Read Judson, *Abstract Algebra: Theory and Applications*, **Annual Edition 2023, August 11**, chapter 8, printed pp. 97–116, from the [author PDF](https://judsonbooks.org/aata-files/aata-20230811-print.pdf). Checked the numbered statements 8.7,8.11,8.13,8.17,8.18,8.21,8.25–8.28,8.30–8.31,8.34,8.36–8.37 and 8.43 and the surrounding definitions/examples. New content uses q for flip probability and says that this differs from the book's p for correct reception. The decoder must distinguish nearest-neighbor decoding from maximum likelihood for q≥1/2. Minimum-distance detection and correction are separate guarantees. Canonical matrix dimensions and the zero-error case are explicit review targets.

## Independent finite checks

Executed `/tmp/wave5-alg-review-oracle.mjs` using Node 22. The oracle represents words as strings, computes parity equations by selected-character counts and computes error weights from complete codeword lists, independently of the author's bitwise linear-algebra routines.

- All 32,768 binary 3 × 5 parity matrices: complete kernels agree; all 1,048,576 syndromes agree. Single-error detection/correction flags agree with absence of weight 1/weight 1–2 nonzero kernel words.
- All 512 binary 3 × 3 A blocks: independently formed systematic codewords agree with the full kernel of H=(A|I), actual G encoding agrees, and HG=0.
- Sampled rank-deficient as well as full-rank matrices: cosets partition all 32 words; all minimum-weight leaders agree with complete string-based enumeration.
- 288 channel likelihood states, including q=0, 1/2, 1, interior probabilities and 1/2±10⁻¹⁴: products of individual-coordinate probabilities agree within binary64 rounding, with the same complete maximizer sets.

An initial oracle asserted exact equality of differently associated floating-point products; corrected that reviewer assertion to a relative rounding tolerance. No author defect was implied by that numerical association difference.

## Findings resolved during authoring

- Continuous/off-grid maximum likelihood: the initial relative-score tolerance made q=0.5±10⁻¹⁴ incorrectly mark all four candidates as maximizers. The final helper orders by exact integer Hamming distance on either side of one half, ties all candidates only at exactly one half, and treats impossible endpoint events separately. Interior probability underflow is now labelled numerical underflow. The author added regression cases; independent near-half distance-order checks are included in the oracle.
- Item8.43's caption described an undisplayed syndrome difference. The caption now matches the panels and the readout explicitly evaluates H(x+y)=Hx+Hy.

## Final native and visual evidence

The author froze all source files before the reviewer run. Independently executed the existing bounded native runner with `ALG_IDS=8.4,8.5a,8.19a,8.22a,8.27,8.31,8.37,8.38a`: **32 layouts, 244 real native actions, 32 edited/malformed replay gates pass**, covering light/dark and actual1200/320px viewports. This checks visible endpoints in every mode, newly revealed stress-test controls, actual font/halo text extents, full dot/ring radius plus1px, axis labels and model/native control equality. Evidence: `/tmp/wave5-alg-independent-native.log`.

Independently inspected all56 narrow defaults in the14 full-size contact sheets, final8.19a/8.22a caption recaptures, and wide8.37 arbitrary-error and8.38a standard-array captures. Filled/hollow bits, selected outlines, matrix entries, nonzero/zero syndromes and the complete standard array remain legible in both themes. Caption corrections explicitly identify the purple selected outline and avoid falsely assigning A-specific meaning to every blue identity entry. Source and model review has no outstanding findings. Coordinator final source-aligned production gate passes **56/56** actual 320px theme cases, complete statement/scope/proof/caption/readout text and formulas, edited Share links, near-half and tiny-q replay. Log: `/tmp/atlas-wave5-alg-root-production.log`. Source remains frozen.

The reviewer also reran the chapter's11 mathematical groups as part of a bounded23-group ALG/TOP run; all pass. This supplements rather than replaces the independent oracles above.
