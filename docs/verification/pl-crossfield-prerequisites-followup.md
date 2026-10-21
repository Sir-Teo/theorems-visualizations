# PL: nine proof-consumed mathematics prerequisites

Producer boundary, 20 October 2026. Parent `acf697eda8a235710428df17c14e431d3183d655`; read-only preparation `6be18b2`. This candidate adds nine genuine `cs → math` edges across eight of the 46 written PL items. Actual candidate inventory is **9 written / 9 known / 13 whole syllabus**, from **0 / 0 / 4**. Sixteen written edges remain short of 25. This is a bounded prerequisite candidate requiring an independent immutable peer, not a historical source closure or acceptance record.

I read the actual consumer statements, complete existing explanations and scopes, and the complete target statements/proof ideas in LOGIC 2.1, 2.2, 2.3, 3.2, 3.4, 4.1 and 4.2. The edits append explicit proof uses rather than treating the target names as analogies.

| Consumer | Target | Consumed step and boundary |
| --- | --- | --- |
| 1.2 | logic-2.2 | Least constructor-closed-set induction, explicitly adapted from finite formulas to nullary/unary/ternary term syntax; a distinct `if` case. No arbitrary well-founded-relation claim. |
| 1.11 | logic-3.4 | Recursive interpretation of expressions in fixed integers, store as assignment, one-coordinate update. Total arithmetic/Boolean operations; no loop termination claim. |
| 2.2 | logic-3.2 | Innermost matching binders, union/removal FV clauses and alphabetic-variant argument adapted to lambda binders, with free-name and nested-binder freshness. |
| 2.6 | logic-2.3 | Exhaust all four assignments for each binary Boolean connective and both assignments for negation after reduction. Pair projections separately use beta reduction. |
| 3.10 | logic-4.1 | Actual modus ponens applications in the hypothetical implication derivation. |
| 3.10 | logic-4.2 | Discharge only the temporary `C`, while `C → (C → Z)` and `(C → Z) → C` remain fixed background premises. This fits the exact Hilbert deduction theorem; no self-containing finite FOL formula or new inference rule is assumed to follow from it. |
| 4.8 | logic-2.1 | Unique readability restricted to finite base/parenthesized-arrow syntax forces ordered domain/codomain decomposition, which syntax-directed checking consumes. Annotations remain essential. |
| 4.11 | logic-2.2 | Finite type-tree recursion defines reducibility at an arrow from its two proper type subtrees; explicitly separate from strengthened typing-derivation induction and term reduction size. |
| 4.13 | logic-2.2 | Recursive type-tree size and strict proper-child inequality rule out `T = T → S` for finite simple types. Recursive/equirecursive equations excluded. |

No conditional PL 2.3 edge was added. Same-field TOC/ALGO links do not count. The existing item 3.10 already had `pl-2.8`; its omitted syllabus row now has it too. That synchronization earns no crossfield edge. Every full old dependency list is retained, and each changed syllabus row exactly matches its item. No touched item occurs on a bridge: the only PL bridge reference is unchanged `pl-2.9` in `fixed-points.js`, whose algebraic fixed-point/strategy qualification still agrees with that unchanged item.

## Preservation and mathematical checks

`node tests/verification-pl-prerequisites-preservation.mjs /tmp/atlas-pl-prereqs/before <candidate-root>` passes: all **46 full objects and 46 visualization function texts**, all source/review flags (including absent properties), chapter bytes outside the owned idea/dependency fields, all helper/collection bytes, and all **115 full syllabus rows**. The explicit guard is outside the default test glob. `pl-prerequisites-evidence.json` records every full object hash, function hash, original/candidate complete dependency lists, raw flag states, all syllabus dependency lists and every PL file hash. No helper or visualization changed.

`node --test tests/verification-pl-prerequisites.test.mjs`: **6/6 pass**. Tests include finite nullary/unary/ternary trees and proper-subtree measures; 169 integer stores × seven independent expression expectations and one-coordinate update; capture/shadowing-safe and unsafe binding examples; all ten Church Boolean assignments plus two pair projections; an independent Hilbert proof checker with an explicit deduction transformation and fixed background premises; and finite type parse/size witnesses, annotation examples and the occurs-check obstruction. These are finite witnesses and proof-step checks, not claims that finite enumeration proves strong normalization or a historical theorem. Initial test drafting used wrong parser/macro spellings and arbitrary fixture-count thresholds; the initial failure log is preserved, corrected tests pass without content changes.

`node scripts/build.mjs --strict`: 6684 written / 6890 planned / 450 chapters / 85 collections, **0 errors, 0 warnings**, home 112693 bytes gzip. `node scripts/check.mjs pl --static`: **46 / 0 / 0**. Strict validation includes dependency/cycle checks. The inventory is computed read-only through the exported inventory function; no global inventory file was written.

## Actual narrow output

`node tests/verification-pl-prerequisites-native.mjs` opens all eight actual strict-built item pages at **320px**, light and dark: 16 page states, 32 statement/scope and full-proof captures, no runtime/TeX failures or reported text overflow. Production statement border-box is 288px with 3px border + 32px padding, hence **253px actual statement text**; proof text is 288px. Some first production locator screenshots contain the sticky site header over text; they are preserved, not the sole full-text visual evidence.

`node tests/verification-pl-prerequisites-text253.mjs` additionally renders the complete actual source strings using the unchanged production rich renderer/CSS in the native harness, with statement content width **253px** and the complete proof explicitly constrained to **253px**. Existing scope strings are inserted using the same renderer. The harness title/viz remain real, no theorem content or runtime implementation is rewritten. Sixteen states / 32 complete text captures pass visible text-range bounds, runtime, blank and TeX checks. I personally viewed all 32 final complete statement/scope/proof PNGs, in eight unscaled four-column contact sheets; light and dark text, formulas and scope qualifications are legible and contained. No content wrap successor was necessary.

The initial range probe counted clipped accessibility MathML as visible rectangles and falsely reported overflow. Its raw result is retained; the final probe excludes only `.katex-mathml`, annotations and script/style nodes, retaining every visible text node and rendered math glyph. Final visible bounds pass without editing content or relaxing width. Production-page raw data and final 253px raw data, browser identities and PNG SHA256 values are in the evidence manifest.

Evidence root `/tmp/atlas-pl-prereqs`; complete final text pixels `/tmp/atlas-pl-prereqs/text253-final`, native built-page pixels `/tmp/atlas-pl-prereqs/native`. Both probes use private ephemeral server ports and close browsers/servers in `finally`. No timing measurement, map repair, shared runtime, global metadata, source flag or production graph change is part of this candidate. The rejected map boundary remains unchanged. Independent peer acceptance remains required.
