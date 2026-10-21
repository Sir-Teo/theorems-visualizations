# Philosophy 4.1: strengthened liar, status equality and explicit enrichment

Status: **resolved: phil-4.1, after independent root acceptance**. Scope is only item 4.1 and its isolated import, its matching syllabus row, a new helper, two tests and this report. Accepted 4.7/4.8, all neighboring objects and shared code are preserved. No Git mutation, central ledger/plan, generated data or full build was performed.

## Sources actually read

**Saul Kripke, “Outline of a Theory of Truth,” Journal of Philosophy 72 (1975), 690–716.** An actual original scan was acquired, rather than relying on an encyclopedia description.

- Working scan URL: `http://thatmarcusfamily.org/philosophy/Course_Websites/Readings/Kripke%20-%20Outline%20of%20a%20Theory%20of%20Truth.pdf`.
- Retained `/tmp/atlas-phil-kripke1975.pdf`, 28 PDF pages including cover, SHA256 `d03065e84d9eae4aa9f8fa6e76b9a2ab8e2faa20d3f8a540ee9a6a8551d4b339`.
- Complete navigation extraction `/tmp/atlas-phil-kripke1975.txt`, SHA256 `400a3ac3bd954fea87ce925fefcf8eb72ee6ec36dd60d72e9cd604622db4d3e3`.
- Read printed pp. 699–701: the source's limited philosophical claim, partial predicates with disjoint extension/anti-extension, strong Kleene negation and truth evaluation. Read printed pp. 714–715 completely: external versus object-language claims, failure of a universal-language claim, adapted semantic Convention T, and the alternative “closing off” construction with its changed Convention T. The latter expressly does not justify saying that all gap theories fail.
- Also read printed pp. 704–705 on the transfinite construction to distinguish it from this finite checker, and the relevant printed pp. 693–694 truth-teller/groundedness discussion. No full 27-page article reading or full fixed-point theorem verification is claimed.
- Visually inspected the actual printed p. 700 negation definition and pp. 714–715 metalanguage/Convention T passages: `/tmp/atlas-phil-kripke-http-page-12.png`, `...-page-26.png`, `...-page-27.png`. This matters because extraction mangles some notation.

**Adam Přenosil, “Four-valued logics of truth, non-falsity, exact truth, and material equivalence,” arXiv:2111.09978v1, 18 November 2021.** This is a primary author technical exposition, identified precisely; no claim of reading Belnap's or Dunn's original 1970s papers is made.

- Version-specific public source: https://arxiv.org/abs/2111.09978v1.
- Retained `/tmp/atlas-phil-fde2021.pdf`, 20 pages, SHA256 `c95466c2c3f68dad05861616299a08b0db771673ba584c675d43b124c04b728f`.
- Extraction `/tmp/atlas-phil-fde2021.txt`, SHA256 `828e7194dd82b4d5b0752e76976939ea9c546994ae47528a0bc6cfc8cd762470`.
- Read the complete introduction, pp. 1–2, and §§2.3–2.4 through the relevant definitions and facts on pp. 5–7. Independent truth/falsity features yield true-only, false-only, neither and both; De Morgan negation fixes the latter two separately. The designated truth predicate `{t,b}` differs from exact truth `{t}`. Actual Figure 1 and pp. 6–7 formulas were inspected at `/tmp/atlas-phil-fde2021-page-6.png` and `...-page-7.png`.
- The finite illustration borrows only these explicitly stated status and negation conventions. It does not implement the paper's full consequence relations, exact-truth logic, or its specialized use of an equality predicate as material equivalence. The added `E` operator is an authored enrichment derived below, not attributed to this paper.

Removed unsupported ancient priority, an unread Priest-specific attribution and blanket assertions that every partial/paraconsistent theory collapses under a strengthened liar. Public refs/credit name the actual sources used. No claim of an agreed general solution is made.

## Actual prerequisite

Read the full authored `logic-1.7` item in `content/logic/ch01-b.js`: its classical liar argument and explicit self-reference/T-schema/two-valued assumptions, finite truth-assignment checker, and truth-teller contrast. Those are the concepts required for the new finite status equation. `deps: ['logic-1.7']` is retained and agrees with the matching syllabus row. No prerequisite was edited; the audited item does not inherit that prerequisite's historical-priority credit.

## Declared finite model and independent derivation

Each sentence receives two Boolean metalanguage coordinates `(t,f)`, indicating truth and falsity support independently. The statuses are T=`(1,0)`, F=`(0,1)`, N=`(0,0)` and B=`(1,1)`. Numeric helper codes are `t+2f`; display letters and pairs are explicit.

Value-transparent truth preserves the entire status: `v(T(name(A)))=v(A)`. The object negation used here is `neg(t,f)=(f,t)`.

- The liar's exact self-status requirement is `(t,f)=(f,t)`. It holds exactly when `t=f`. Thus the classical domain `{T,F}` has no solution, the gap domain `{T,F,N}` has N, the glut domain `{T,F,B}` has B, and the four-status domain has N and B. A fixed B is not classical consistency.
- The one truth-teller requirement is identity, so every permitted status is fixed. This does not say that every such status is produced by a particular minimal semantic construction of a full language.
- The total external metalanguage classification “not true” reports whether the truth coordinate is absent: `E(t,f)=(1-t,t)`. Its table is T→F, F→T, N→T, B→F. In particular, `E(N)` differs from object `neg(N)`, and `E(B)` differs from object `neg(B)`.
- External classification alone makes **no self-equation**. The helper deliberately returns `fixed: null`, and the visualization says “report,” rather than silently treating an external description as a sentence of the object language.
- Only the explicit enrichment toggle adds a self-applicable object operator with exactly that E rule and imposes `(t,f)=E(t,f)`. Its first coordinate requires `t=1-t`, impossible for either Boolean truth flag. This conditional obstruction applies to this particular added rule. It does not establish that every theory allowing gaps or gluts is inconsistent.

Exact status equality is a metalanguage comparison. It is not a claim that every object-language material biconditional `T(name(A))↔A` has truth support. For example, under the same partial connective conventions, at N both sides have equal status, but the material formula `(neg(A)∨A)∧(neg(A)∨A)` remains N. The scope states this difference explicitly.

There is no iteration or claim about transfinite stages, a least fixed point, a full truth language, entailment, soundness or completeness. The finite enumeration is exhaustive for the authored four-pair model only.

## Implementation

The former layout and undifferentiated “untrue” third value are replaced by four labeled rows showing assigned status, operation output and exact check. Excluded rows remain visible but dimmed, so changing a domain does not hide what its exclusion means. Fixed rows are highlighted only when comparison is imposed and the row is permitted.

The operation selector offers object liar negation, a truth-teller and external not-true classification. Four domain buttons control which statuses are permitted. The explicit enrichment toggle is visible only for external classification; its actual checkbox state persists when hidden and has no effect on the other two operations. Readouts list exactly the allowed mappings and distinguish no permitted fixed status from no self-equation at all.

One padded stage contains all four complete row rectangles, eight hollow badges, pair labels, arrows and checks. T/F/N/B and both coordinates are shown, so meaning does not depend on color. The source text, caption, readout, scope and matching syllabus description use the same rules.

## Independent mathematical checks

```sh
node --test tests/verification-phil-liar.test.mjs
```

`/tmp/atlas-phil-liar-math-final.log`: **4 groups pass**, actual exit 0. The draft first passed under `/tmp/verification-phil-liar.test.mjs` before installation into the default test glob.

The reference represents statuses as independent sets of the labels `true` and `false`, rather than reusing the helper's bit arithmetic. It checks all 24 operation/domain/enrichment combinations and all 96 displayed rows, exact fixed-status sets and allowed flags, involution of object negation, the distinct E outputs at N/B, and identity of transparent truth-telling. Explicit certificates prove the classical obstruction, gap/glut witnesses, all-domain E obstruction and the external-report null distinction. Independent conjunction/disjunction evaluation supplies the N-valued material-biconditional counterexample. Invalid status/control values are rejected and separately returned rows do not share mutable results.

## Native browser and visual checks

```sh
node tests/verification-phil-liar.mjs
```

`/tmp/atlas-phil-liar-native-final.log`: **4 groups pass**, at 1450/430 pixels × light/dark; final session 5773 exited 0 and closed the browser in `finally`. This complete rerun includes the additional scope rendering.

Every group genuinely clicks each operation/domain selector and both explicit E-toggle states. Native Enter/Space selector activation and Space on the actual checkbox also work. The run covers all 24 model settings, including a true checkbox retained while hidden under liar/teller modes. It checks selected `aria-pressed` buttons, checkbox/display state, every assigned/output pair, each permitted/excluded/fixed/report/changes label and all readout mappings against an independent reference.

Geometry checks include complete rectangle half-strokes and hollow-dot radii plus their 0.9-pixel half-strokes. All measured row-label rectangles are mutually separate; bit labels clear their complete hollow badges. All canvas text and glyphs fit, with no browser/TeX error, display-TeX overflow or page overflow. The native harness additionally renders the item's full scope so its biconditional formula and qualification receive the same TeX/page checks.

Representative actual stage images inspected, regenerated without any canvas change by the final scope-render run:

- `/tmp/atlas-phil-liar-classical-1450-light-panel.png`: no classical fixed status; separate dim N/B rows.
- `/tmp/atlas-phil-liar-external-report-430-light-panel.png`: every row says report and E maps N/B differently from negation.
- `/tmp/atlas-phil-liar-enriched-430-dark-panel.png`: explicit added rule, all four rows change.
- `/tmp/atlas-phil-liar-four-430-dark-panel.png`: separate fixed N/B witnesses, visible pairs and full badges.
- Final `/tmp/atlas-phil-liar-enriched-430-dark.png`, `/tmp/atlas-phil-liar-gap-430-light.png`, `/tmp/atlas-phil-liar-four-1450-dark.png`: full mobile and desktop pages were inspected after the final scope-render run. All controls, wrapped prose, formulas, readouts and the semantic-equality/object-biconditional qualification remain readable. The native-size panel images separately establish label/badge clarity without shrinking a tall page.

Static `node scripts/check.mjs phil-4.1 --static` passes 1 item, 0 errors, 0 warnings; `/tmp/atlas-phil-liar-static-final.log`, final session 73736 exited 0. Read-only byte comparisons prove the whole chapter outside 4.1/new import and the whole syllabus outside row 4.1 unchanged against HEAD. `git diff --check` passes. No full build or central reconciliation is claimed.

## Frozen integration paths

- `content/phil/ch04.js`: only 4.1 and new isolated helper import.
- `content/phil/syllabus.js`: only 4.1 row.
- `content/phil/source-audit-liar.js`.
- `tests/verification-phil-liar.test.mjs`.
- `tests/verification-phil-liar.mjs`.
- `docs/verification/phil-liar-followup.md`.

The final `verify: false` records root acceptance. All source and mathematical claims required by this narrower item have identified reading support or explicit independent derivations; no unread historical theory is used for closure.

## Independent root acceptance

Root read the actual original Kripke scan’s complete printed pp. 699–701 and 714–715, including the actual p. 700/714/715 images, and Přenosil’s introduction and §§2.3–2.4 on PDF pp. 5–7, with actual pp. 6/7 images. The root source reading is limited to those passages; the broader agent reading above is not restated as root reading. Kripke’s closing-off discussion changes the truth convention and does not justify a universal collapse claim. The four-status negation and the distinction between truth support and exact truth agree with the declared technical conventions.

Root read the complete helper, public item, mathematical/native tests, and the actual logic-1.7 statement/argument. Independently solving the pair equations gives t=f for liar negation, every permitted pair for transparent telling, and the impossible Boolean equation t=1−t only for the explicit added E self-rule. An external report supplies no equation. Root separately checked the N-valued material-biconditional counterexample.

Root added a strict string-domain check so arrays or objects coercing to an allowed key are rejected. The corresponding mathematical regressions pass. All **4 math groups** and the final **4 native groups** on those final helper bytes pass; static checks give **1 item / 0 errors / 0 warnings**. Logs `/tmp/atlas-root-phil-liar-{math,native,static}.log`; all processes exited 0. Root inspected complete narrow light/dark pages and actual external-report, enriched-E and four-status panels. Full rows, independent support pairs, excluded states and the conditional enrichment remain legible. Chapter neighbors and other syllabus rows are guarded; the final source flag and queue agree.
