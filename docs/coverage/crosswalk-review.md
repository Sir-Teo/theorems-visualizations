# Classification routing review: registry 0.3.0

October 22, 2026. This U1 checkpoint reviews all 79 entries marked `review` at baseline `0317c54a1db1f2d6e463c04b2daefb6b0f4eaf88`. It resolves 68 ISCED entries as bounded editorial navigation routes and retains 11 explicit review gates. The registry now has **205 mapped entries, 11 review entries and one exclusion**. All 217 identifiers, four inventory editions and code hashes are unchanged. No lesson, source receipt count, runtime collection or production acceptance is added.

## What changed and why

The old routes treated unspecified detail, residual fields and interdisciplinary programmes too similarly. Some narrow fields inherited an entire broad domain group. The revised records name the source-code kind and its exact parent scope, then supply original editorial entry points and an explicit next action. All 217 rows now carry a routing kind; the independent decision batch covers the 79 previously flagged rows.

| Source-code situation | Atlas treatment |
| --- | --- |
| Subject category | A bounded subject entry point; formal equivalence is not implied |
| Not further defined | Retain missing detail within the named broad or narrow parent |
| Not elsewhere classified | Retain a residual within that parent; do not turn “other” into every domain |
| Interdisciplinary | Retain the named broad-field route; actual programme content is required to infer other components |
| LCC main class | Main-class discovery only; detailed schedules remain unaudited |
| Heritage domain | Provisional discovery with explicit source/context and community gates |
| Unknown field | ISCED 9999 remains excluded, with no domain claim |

Examples make the practical narrowing clear: languages `0230`/`0239` lead to D23/D24 rather than every humanities domain; journalism/information `0320`/`0329` lead to D28; mathematics/statistics `0540` leads to D01/D02; health `0910`/`0919` leads to D09. Environmental/occupational services `1020`/`1029` retain environment, health and engineering entry points. Generic programmes `0000`/`0099` use D19 for learning orientation only, without reclassifying them as subject-specialist education.

These are editorial choices for entering the atlas. They are not official programme assignments, exhaustive unions of all child fields, evidence that every linked domain is taught, or independent specialist endorsement. Welfare, security, food-processing and other contextual links keep their per-row rationale and actual-topic requirement.

## Source evidence and access limits

The controlling education source is [UNESCO-UIS, ISCED-F 2013 detailed field descriptions, published 2015](https://www.ksh.hu/docs/osztalyozasok/keor/isced-f_2013_eng.pdf), Appendix I printed pp. 54–58, with relevant parent descriptions. Source receipt `isced2013` pins SHA-256:

`b320b3006ff82ef7f7d3c9182a3c380bbab50db3e59b725b3c5467f5a764d44f`

The author and separate source reviewer rechecked the local PDF hash, inspected all five table-page images and checked the relevant descriptions. The reviewer examined every changed ISCED row: 30 unspecified, 28 residual and ten interdisciplinary entries. The complete row register is in the [independent source report](reviews/crosswalk-source-20261022.md). No PDF or page image is redistributed in this package; attribution and the existing reuse plan remain in `sources.json`.

The discrepant Finnish reference is not merged into the pinned table. The unavailable 2014 coding-manual URL and later official landing-page discovery supply no new manual-body evidence. The 2015 descriptions themselves support the interdisciplinary distinction used here. Survey-specific coding conventions from other editions are not imported.

FORD's earlier Table 2.2 text receipt remains limited by the later download stop. Heritage discovery remains indexed-only with its recorded CAPTCHA stop. Neither stopped body nor a mirror was fetched for this review. The source count remains 45; the existing ISCED receipt now records the narrower reinspection scope.

## Eleven retained gates and next actions

| Entries | Retained limit | Next work |
| --- | --- | --- |
| FORD `1.7`, `2.11`, `3.5`, `4.5`, `5.9`, `6.5` | Candidate homes for residual research fields; no fresh detailed membership verification | Research a concrete residual topic with an authorized source defining its scope. Record why it belongs and what it excludes; do not recover the stopped manual body. |
| Heritage `oral-traditions`, `performing-arts`, `social-practices`, `nature-knowledge`, `craftsmanship` | Local discovery slugs, prior indexed evidence, no community-specific vocabulary or permission | Develop a separately authorized, situated topic with community-specific sources, context, representation and applicable permissions. Do not treat broad heritage labels as a practice licence or recover the stopped overview. |

An independent review can confirm that retaining a gate is correct. It does not close that gate. Detailed library schedules, local classifications, additional languages and community vocabularies remain future research; this checkpoint is not a completeness claim for human knowledge.

## Independent review and executable checks

Batch `u1-crosswalk-20261022` has two independent AI receipts: [source routing](reviews/crosswalk-source-20261022.md) by `atlas-ai-history-review`, and [engineering](reviews/crosswalk-code-20261022.md) by `code_review`. Both reproduce this exact review digest:

`5103e5a69c8510c3bcfd5d5c754cd0e80375b9c50eb09dfc5ad38c063d918343`

The digest binds the selected rows, routing policy, domain meanings, relevant inventory editions/pins and source-access receipts. Changing those inputs invalidates the current acceptance. Status and the receipts themselves are excluded to avoid self-reference. Unrelated pilot planning actions are outside this classification digest. Reviewer identities declare AI scope; they do not imply professional credentials.

Engineering review found and rechecked one repair: malformed receipt arrays or null entries now produce diagnostics instead of throwing and discarding other validation errors. Evidence paths remain confined to the review directory, and referenced files must name the digest. These checks validate the declared evidence structure; they cannot establish the truth of a review report on their own.

| Check | Result and scope |
| --- | --- |
| Coverage CLI | Pass: 30 domains, 85 primary collection homes, eight cross-listings, 217 entries, 79 reviewed decisions, 45 source receipts and eight briefs |
| Registry suite | 27/27 pass, including changed route/domain/source/edition bindings and malformed evidence metadata |
| Focused offline package suites | 71/71 pass; registry, exploration contract, overlay preservation, method and studio models |
| Preview reproducibility | Seven generated pages match; all six pilot content/artifact digests and local acceptance states remain unchanged |
| Browser/runtime scope | No runtime, renderer or preview changes in this checkpoint; no new browser session or human observation claimed |

Run the read-only accepted-base rehearsal from the integration checkout:

```sh
node scripts/check-exploration-integration.mjs \
  --repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --base facab15e297c645d4826935f2c011a4cf367ee88
```

The manifest includes 88 additive files. The rehearsal exports the pinned commit into a temporary snapshot, validates the package and reports hashes without writing to either active Wave checkout. `MASTER_PLAN.md` remains a separate manual reconciliation. A newer active commit is not automatically an accepted integration base.

## Preservation and continuation

A read-only check of 3,222 files in the original root checkout found only the previously authorized handoff-pointer change from the saved baseline. This batch made no root-checkout edits. The frozen Wave 6 `chapters` payload still has SHA-256 `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af` in the expansion, redesign and preserved shipping checkouts. Observed heads were `4efe60194ead8a04b9b553ee4b527672a87fcfce`, `3c2952088e77e800578675c39c049447d495d132` and `f0a324f98f5f7f2538f7685b84d1041764a65828`; the active chats may continue advancing them.

The full master-plan goal remains active. P07/P08 still occupy both unaccepted lesson slots; this classification work does not open a third slot. Continue independent domain-orientation research, integration preparation and stewardship from the [execution ledger](../master-plan-execution.md), while retaining real-world and professional review gates. No push, PR, merge or deployment has been performed.
