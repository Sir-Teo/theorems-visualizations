# Independent journey-reader content preservation review

Date: 2026-10-22. Reviewer: independent AI reader/content desk reviewer (`history_review`), separate from the author. This is a bounded technical/editorial preservation review, not qualified professional review, cultural authority, human observation, rights clearance, journey acceptance or public distribution authorization.

## Current status

Final scoped preservation review: JR-C1 is repaired and independently rechecked. No remaining actionable content-preservation defect was identified within this review. The current exact binding is the final recheck below (delivery digest `43a976946250477f0fa8ed7b344101fa2b8e3085bb606ba9d66a96fb4bd46605`). The initial finding and candidate bindings are historical, retained for chronology. This is not route acceptance or release authorization.

## Methods and actual scope

Read `journeys/reader.mjs`, `journeys/style.css`, `scripts/build-journeys.mjs`, all three routes in `docs/journeys/plans.json`, the five source records and two stopped candidates in `sources.json`, and the exact target destinations. Retained the scoped research reviews in `review-evidence.md`, `review-cloth.md` and `review-structure.md`; this review does not represent their source readings as newly performed.

Called `prepareJourneys()`, derived target availability with `deliveredTargets()` from its accepted legacy identity set and actual preview edition catalog, then generated HTML/catalog in memory with `renderJourneys()`. Compared the escaped text of every route title, scope, outcome, transfer, gap statement, all 14 stop titles/questions/limits, all 13 non-gap tasks/checks/entry explanations, all 11 transition reasons/limits, and all displayed source title/creator/read-date/edition/locator/finding/limits/reuse fields. Checked all ten exact lesson hrefs, including history 0.1.2 and agriculture 0.1.0. The generated pages retain two analogies and nine question shifts rather than inventing prerequisite or evidential edges.

Repeated rendering for each of ten required target stops set independently to `missing` and `withdrawn` (20 scenarios). Each owning route withheld its full narrative, lesson links and source cards; its catalog entry withheld title/outcome/stops and retained only reserved identity/availability information. The other two routes remained available. Rendering no retained route entries produced no journey outputs. Checked the actual 30-domain catalog adaptation, including the available D16 orientation link at the legal gap.

No browser, source fetch, external service, private notebook, user-store read/write, authored plan edit, Wave checkout edit or human session was performed. This is source/HTML inspection and pure-function execution, not a native layout, screen-reader or learning observation.

## Findings

### JR-C1 — historical finding, resolved in final recheck

The `woven-cloth/practice` task says “Use the retained Asare/Dento Mills research brief” but the reader supplies the provider URLs and retained source-description cards, without an identifiable link to that named research brief. The underlying instruction in `docs/journeys/plans.json` is an editorial preparation instruction; `journeys/reader.mjs` currently renders it verbatim in the non-gap task branch (line 134 at the candidate binding below). A reader cannot locate the specifically requested brief through this page.

The requested narrow repair was to adapt this instruction to the retained source descriptions actually displayed, and condition use of the external linked pages on availability; alternatively deliberately deliver and link the exact scoped brief. Preserve the provider/self-presentation, same-provider-not-independent, no current-offer verification, no object/practice/learning evidence and no design-reuse limits. No new source retrieval is needed for that repair.

### Preserved content and boundaries

- **Water and a city:** ideal flow conditions include steady/inviscid/constant density/uniform gravity/streamline; the aqueduct remains an authored model with gradient disagreement; outbreak data and denominators remain distinct; the planning task remains fictional and US institutional guidance does not establish participation, consent or legal duty. This reader adds no engineering or medical advice.
- **A woven cloth:** outline symmetry, binary interlacing, laboratory/single-plot soil observations and the two-good trade model remain separate representations. The source cards identify one provider perspective and retained scoped reading. No image, loom, course, physical cloth, maker permission, community representation or practical competence is supplied. P07 remains excluded as an unaccepted target.
- **How an account becomes evidence:** proposal/acceptance/rhetoric and missing Mexican acceptance evidence remain bounded; repeated accounts do not become an i.i.d. sample; potential-outcome definition does not identify a causal effect. Reuters remains an external reading of stated practice, not a universal code or observed adherence.
- **Legal gap:** the reader intentionally displays its question, explicit absence/limit and available domain orientation. It omits the internal editorial preparation task, check and entry explanation; no legal lesson, legal answer key, personal remedy or completion requirement is promised. The surrounding transitions and route gaps continue to state the missing qualified legal review and legal-effective snapshot.
- **Source provenance:** EPA, NARA and Reuters keep their recorded read dates, editions/locators and limitations. Asare records visibly say “Earlier scoped reading retained”; their two pages are not presented as independent corroboration. All five reuse scopes survive. Stopped UN-Water/SPJ bodies and all earlier source stops were not retrieved or recovered.
- **Privacy and availability:** the generated reader has no scripts, forms, frames or storage API calls, supplies no completion/mastery state, and declares that notes/selections/completion are not read, written or migrated. This conclusion applies to these reader outputs, not every destination site/page. The whole-route withholding behavior avoids exposing removed material through route paraphrases.

## Historical candidate bindings (before JR-C1 repair; superseded below)

SHA-256, computed from actual file bytes / exported digest functions:

| Item | SHA-256 |
|---|---|
| Research digest (`researchDigest(data)`) | `662d3b5042f7924939e351fa11470085a9a6d8bc4c6b156057b8b87889c026dc` |
| Delivery digest (`prepareJourneys().binding.digest`) | `ae7633b4eeb422da00fb48524466b5755987c7c3829b96af8484c4342490e674` |
| Predecessor navigation digest | `5717f96499c09be3c025bbb3942d52be7691143715f64a34b132d5e92485fddb` |
| `journeys/reader.mjs` | `71bd28dd7dce9f00f454d9597dc5278f5640ef61f6f5c3e00a8f92b80a9c03ed` |
| `journeys/style.css` | `fdd886d9b130790dbed73e9e5dfb5095c1ad053a6f595f9e674931af801aed51` |
| `scripts/build-journeys.mjs` | `a797348b6a759b24f434f8335e5c3901379905a609322b8aca67be7d0ef0d113` |
| `docs/journeys/plans.json` | `84767433923d05fbb36805629416d4e95639d795ac9ff517eada9b8f9c084cea` |
| `docs/journeys/sources.json` | `19bf445bdcf1af51a7231f2af839ef0a2640e1f9fc72916e8b881223605a54e1` |
| `docs/journeys/targets.json` | `b65b434fc43942417cfb7ddd78a5416e3e724bb915577c8c6c854f4ef83937c2` |
| `docs/journeys/review-evidence.md` | `f607322c1263593025a73be927de66482fa517718435f1a48405527cd712e273` |
| `docs/journeys/review-cloth.md` | `377ef7f80ef004d19bf9844dc1f5f529e8c3706abc4733d657eb79967d00e5ec` |
| `docs/journeys/review-structure.md` | `1337d40465c8e99fe6aed0bdbcdd3772e207be193910d69dc52c8807f6f871f5` |
| `scripts/check-journey-plans.mjs` | `1c81ac826a9d059b9e52566b53ea75a3caf5f5d560346ee675c0d1b96c6cc2e0` |

Pure preview outputs with the actual 30-domain catalog (not the earlier no-domain diagnostic render): water-city `b4056625e16611b625d2e307b5aa632ff2255f84df5d41ee0037fc4e2e5d606b`; woven-cloth `c75bec26f9c5d69b8581f7edfbdb442ea7b9a986899e6c67affb740dd93e8b83`; account-evidence `1982c6bafe210f24bb368219e0b8eb8e614398e4871c20533d9c469bbb2673bb`; index `ea1f1e428431c2ac7e5359c59a629e809aa1448f53991582738e24806e19d4f5`; about `bf9b939239432911c18c1e01f549e6dbe3f8c4578091868b54afbf2a8a98b29e`; catalog `15c92728e20e0b810fd246075820c6d60693792af52126c0b2fcf954118d4a3d`.

## Limits and open gates

These are local reader candidates preserving research-prepared routes, with zero new lessons and no route acceptance. No fresh body/provenance/rights verification, practitioner or qualified professional review, human learning/access observation, general cultural mandate, global coverage finding or public release authorization is supplied by this report. Native/browser behavior, final physical archive assembly, full engineering validation and actual distribution decisions belong to their distinct evidence/authorization processes.


## Final JR-C1 disposition and exact-version recheck

Rechecked on 2026-10-22 after the author added guarded `readerTask()` in `journeys/reader.mjs`. It changes only `woven-cloth/practice` and first verifies the exact expected source-plan instruction; all other steps return their original task. The rendered instruction is now “Read the retained source descriptions below and, if accessible, their linked pages.” Its remaining substantive task (distinguish self-description/advertised workshop from object, making-session or learner evidence), reasoning check, entry explanation, limits and source receipts remain intact. The unavailable named-brief instruction is absent. **JR-C1 resolved.**

Recomputed `prepareJourneys()` and actual preview HTML with all 30 domain entries. All 80 unchanged stop-field checks passed, alongside the separately checked replacement task. Repeated all 20 missing/withdrawn-target scenarios successfully. The water-city and account-evidence HTML, index, about page and catalog byte hashes are unchanged from the historical preview above; only the intended cloth HTML changes. Plans, source registry, targets and prior research reports retain their exact historical hashes. No source was fetched, no new professional/cultural claim added and no authored plan changed by this reviewer.

Current final bindings:

| Item | SHA-256 |
|---|---|
| Research digest | `662d3b5042f7924939e351fa11470085a9a6d8bc4c6b156057b8b87889c026dc` |
| Delivery digest | `43a976946250477f0fa8ed7b344101fa2b8e3085bb606ba9d66a96fb4bd46605` |
| Navigation digest | `5717f96499c09be3c025bbb3942d52be7691143715f64a34b132d5e92485fddb` |
| `journeys/reader.mjs` | `44a7dc7d7141b3e098e3aab893400efbdcce5d4f666a90fac282098653b05960` |
| `journeys/style.css` | `fdd886d9b130790dbed73e9e5dfb5095c1ad053a6f595f9e674931af801aed51` |
| `scripts/build-journeys.mjs` | `a797348b6a759b24f434f8335e5c3901379905a609322b8aca67be7d0ef0d113` |
| `docs/journeys/plans.json` | `84767433923d05fbb36805629416d4e95639d795ac9ff517eada9b8f9c084cea` |
| `docs/journeys/sources.json` | `19bf445bdcf1af51a7231f2af839ef0a2640e1f9fc72916e8b881223605a54e1` |
| `docs/journeys/targets.json` | `b65b434fc43942417cfb7ddd78a5416e3e724bb915577c8c6c854f4ef83937c2` |
| `docs/journeys/review-evidence.md` | `f607322c1263593025a73be927de66482fa517718435f1a48405527cd712e273` |
| `docs/journeys/review-cloth.md` | `377ef7f80ef004d19bf9844dc1f5f529e8c3706abc4733d657eb79967d00e5ec` |
| `docs/journeys/review-structure.md` | `1337d40465c8e99fe6aed0bdbcdd3772e207be193910d69dc52c8807f6f871f5` |
| `scripts/check-journey-plans.mjs` | `1c81ac826a9d059b9e52566b53ea75a3caf5f5d560346ee675c0d1b96c6cc2e0` |
| Retained source registry `docs/pilots/sequences/sources.json` | `aa728ce4083c7d242484c8f998168f5e61e03e30f312ff12b0bd4e02736b18c6` |
| Final pure preview `journeys/woven-cloth/index.html` | `7cc72e587ea90fc82d9c6fbe94ce9bd34c9f838475122f3862995cf8e904f6d0` |

The preservation decision is suitable as an honest bounded AI content/adaptation receipt for this exact reader candidate. It does not supply fresh source/rights review, native or assistive-technology observations, route acceptance, professional qualification, community mandate, observed learning or public distribution authorization. All open gates and review limitations above remain applicable.
