# Thirty domain orientations

Edition 0.1.0 · October 22, 2026 · local preview · U3 navigation work.

The [domain index](../../labs/atlas/domains/) and 30 domain pages provide a starting question, an editorial outline, ways to explore, explicit gaps and a concrete next reading task. Each route cites an institutional source passage actually read. They are orientation pages, not lessons, complete syllabi, professional advice or claims of introductory coverage. They add no accepted production items. The two unaccepted lesson slots remain occupied by P07/P08.

## Research and scope

[overviews.json](overviews.json) holds the original editorial writing and [overview-sources.json](overview-sources.json) holds 30 separate reading receipts. These supplement the registry's 45 classification/pilot receipts without changing that denominator. The source locators identify exactly what was read: for example, a course syllabus, an introductory framework, or a short definition. The original territory outline and suggested exploration methods extend beyond that narrow source and are labeled as editorial framing.

The sources provide useful entry points across mathematics, research methods, computing, physical/life/earth sciences, engineering, health, agriculture, cities, economics, institutions, humanities, language, arts, making and movement. Their limitations remain visible on each page: the analysis course expects multivariable calculus; US legal and anthropological explanations are scoped to their context; older urban-design and financial-statement introductions do not establish current policy or standards; literary theory and English-language routes are partial. The ecology framework's stated omission of traditional ecological knowledge is retained. No clinical, legal, exercise or physical-practice approval is implied by a link.

Every page records place, language and practice gaps. Most current routes are English-language institutional sources. Situated, Indigenous, non-English, sign-language, oral and embodied perspectives remain further sourcing and participation work. A proposed editorial role is not an appointed specialist or community representative.

Only original summaries, navigation citations and reading prompts are included; external images, recordings, scores, assessments and source passages are not republished by this package. A source's terms still govern its materials. In particular, the inspected OpenStax prefaces include CC BY-NC-SA 4.0 and AI-use wording; this package does not represent them as unrestricted assets or settle publication-specific rights.

Five candidates did not supply usable bodies: WHO timed out, UN-Habitat returned 403, a CORE book index had no body text, a guessed MIT music syllabus was unavailable and a V&A craft URL returned 404. These are retained as unavailable candidates, never supporting evidence. The distinct CORE teacher guide and other separately accessible institutional sources supplied bounded routes. Earlier source-access stops remain intact.

## Architecture and review

The sidecar catalog records orientation status separately from registry 0.3.0's U1 planning snapshot. Its `coverage.orientation: planned` values describe that earlier planning inventory; the orientation catalog is the authority for this new edition. No introductory/advanced coverage field is promoted. Production counts and classification-review digests remain unchanged.

The isolated builder reads registry, collection metadata and pilot records, then generates `labs/atlas/domains/index.html` and 30 `Dxx/index.html` pages. It writes no existing pilot output or production file. Public `/domains/Dxx/` routes remain reserved; these local pages use `noindex,nofollow` and have no public canonical or sitemap entries. Links work at a root origin and beneath a static project prefix. Existing collections, locally accepted pilots, prototypes in review and external readings have explicit, distinct labels.

All text, sources and links render without JavaScript. Optional search and method filters do not store data or make external requests. These pages have no note state to migrate. Existing pilot storage and URLs remain unchanged.

Source-content review is divided between two independent AI reviewers, D01–D15 and D16–D30. A separate independent AI reviewer checks engineering. Exact content digests include the selected overviews, used source receipts, related domain titles/context, collection labels and pilot statuses. The engineering artifact digest additionally binds the five orientation code/style/build files. Review metadata is excluded from its own digest to avoid circular hashing. Rendered HTML is reproduced and compared by the builder. A change to content, context or code requires fresh applicable receipts before it can retain `reviewed-local` status. The reports and current review status are recorded in the catalog.

This is bounded AI review. No human screen-reader session, learner trial, physical reproduction, professional competence, cultural representation approval or community participation is claimed. The existing P01/P02 human-session gate removal does not expand to other pilots.

## Reviewed local checkpoint

The catalog is now `reviewed-local`, with these separately authored AI receipts:

| Review | Scope | Exact content digest |
| --- | --- | --- |
| [Science and institutions](reviews/orientation-science-20261022.md) | D01–D15 | `d968dbcae08511f55dfff94124d79fceadae02415962d851ece7bb760ce5f8c9` |
| [Humanities and practices](reviews/orientation-humanities-20261022.md) | D16–D30 | `020cd9b9ff25cdafbd4c62b2d91534a694c0e1d67f379cb9f319ee4828ce9860` |
| [Engineering](reviews/orientation-code-20261022.md) | All 30 domains | `85f9cc98335776b33950c123a28b476c1bcb13e552f3599358c8eda8d2477680` |

The engineering artifact digest is `17d23371bbbe39d175dc12b71ed6e84758005e884a900ef629795334ae067f17`. Independent review found an extra representation-gap key could pass validation and crash rendering. The contract now requires exactly the three declared gap keys, with a regression test and independent repair confirmation. There are no remaining findings within the recorded AI review scope.

The owner ran 18 orientation contract/route tests and five browser tests successfully. All 30 domain pages load directly and under a project prefix, fit a 320-pixel viewport in both themes and at enlarged text, and retain complete sources/navigation without JavaScript. Desktop and phone screenshots were visually inspected. These are engineering observations, not assistive-technology or learner sessions.

The 132-file integration package passed its isolated accepted-base rehearsal: coverage validation, both generated-output checks and 89 offline tests, preserving all 5,552 files of accepted commit `facab15e297c645d4826935f2c011a4cf367ee88`. Pilot/browser code is unchanged by this batch; the five new orientation browser tests ran separately with one browser. Reproduce using the [integration procedure](../integration/universal-pilots.md). The original checkout's 3,222-file baseline still has only the earlier authorized handoff-pointer change, and all three preserved Wave 6 assignment arrays retain SHA-256 `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af`. Active chats may advance their own work; this package does not write into them.

## Checks and maintenance

```sh
node scripts/build-domain-overviews.mjs --check
node --test tests/domain-overviews.test.mjs
node --test tests/domain-overviews-ui.test.mjs
```

The focused contract tests reject missing/duplicate domains, unsupported source tasks, unavailable sources, unsafe URLs and local paths, false acceptance/publication, stale reviews and malformed metadata. Rendering checks verify escaping, actual local targets, and project-relative links. The browser suite uses one serialized browser for keyboard filters, all 30 direct routes, project-prefix paths, JavaScript-disabled content, phone layouts in both themes and enlarged text. These checks provide engineering evidence, not observed learning effectiveness.

To revise a page: research the specific passage, update its locator/access/reuse limitations and dated original summary, revise the reading task and representation gaps, increment the relevant revision, obtain fresh exact-scope independent receipts, regenerate and run the checks. Unavailable evidence stays unavailable until a separately documented permitted retrieval succeeds. Do not convert the page into a lesson or register public routes through this builder.

Production loading, public routing, three-lesson pilot sequences, cross-method journeys, coverage dashboard, introductory syllabi and stewardship remain in the [whole-roadmap queue](../master-plan-execution.md). Thirty orientation pages do not finish U3 or the master plan.
