# Independent AI engineering review — journey reader

> Integration-owner scope note, after this reviewer's completed recheck: the subsequent Asare instruction adaptation and final packaging/capture changes are outside the earlier engineering binding below. The follow-up reviewer invocation failed with a service notice flagging possible cybersecurity risk and produced no final review. Current author validation is recorded in [the checkpoint](universal-journey-reader.md); final independent engineering approval remains open. The original reviewer report and findings below are retained unchanged.

Separate Codex reviewer `code_review`, 22 October 2026, independent of author. Source/offline inspection in integration worktree only; only this report written. No browser, stopped-source/body retrieval, author-source/other-worktree edit, deployment or human observation.

## Findings and status

**Both reader P2 findings repaired and independently rechecked. Local-preview engineering PASS; final packaging/runtime evidence pending. Inherited release-hardening follow-up remains below; no real release event exists.**

**Resolved reader P2 — raw step ID could inject rendered HTML.** The section template in journeys/reader.mjs interpolates s.id directly into id="step-${s.id}". The planning contract allows any unique nonempty string as an ID. Independently changed the first step ID to `x"><img src=x onerror=alert(1)>` and its matching transition.fromStep; validateJourneyPlans accepts the data, and renderJourneys emits an actual img tag/event handler. Escape the attribute and preferably reject unsafe anchor IDs in the renderer, with a regression demonstrating planner-accepted malicious IDs cannot inject output. Source research files need not be changed.

**Resolved reader P2 — comma-joined release sets allowed one entry to impersonate multiple requirements.** authorize compares sorted reviews.dimension joined with commas to access,content,engineering. Independently supplied one dimension string `access,content,engineering`; the synthetic approval successfully resolved three published routes with only one review entry. Materials use the same delimiter comparison, allowing adjacent material IDs to be combined into one field. Require exact array cardinality/unique allowed dimensions and elementwise or serialized-array equality for materials; add combined-dimension/material regression. No synthetic decision enters the real ledger.

## Independent verification and design assessment

Independently ran Node 22 `node --test tests/journeys.test.mjs`: **10/10 passed**, zero failures/skips/cancellations. Those tests meaningfully cover typed stops/counts, preserved non-gap tasks/source scopes, whole-route withholding, missing/withdrawn exact versions, empty real ledger, exact decision/source/code/destination checks, partial releases, fresh withdrawal exclusion, prose escaping and guarded navigation. The two independent reproductions above expose cases outside those initial tests.

The builder validates frozen research targets/prerequisites/receipts, composes a new domain/edition/legacy candidate, verifies exact legacy snapshot and delivered edition catalog, derives availability from actual pages and exact version statuses, and refuses declared available targets without files. A missing/withdrawn required target withholds the entire dependent narrative/title/tasks/source details, including potential paraphrases elsewhere. Older live versions do not substitute for a missing pinned version. Inactive route catalog/index rows retain only identity/status/target availability, not former prose. Tombstones escape withdrawal reason and omit original content/canonical route; empty real ledger emits no journey page/asset/link or count.

Delivery binding includes full predecessor inputs plus reader/style/builder, frozen research/source/target files/reports, checker, retained provider receipt file and domain release ledger. Actual journey ledger excludes itself from binding to avoid self-reference; decisions/referenced evidence are separately hash-bound and realpath-confined. Final preparation reruns input and entry checks after assembly. Decisions bind research, selected revisions/materials, explicit destination and scoped independent content/access/engineering review declarations with remaining-check disposition. This structure cannot verify credentials, actual grants or truth of declared observations. Current source/version limits require explicit ledger migration for future changed/withdrawn route revisions.

New output is outside checkout through predecessor exclusive creation. Writes reject collisions; old candidate bytes compare except the five exact main-entry adapters and optional sitemap augmentation. No individual legacy body/alias, frozen lesson browser payload or note store is rewritten. Reports distinguish predecessor stages from final additions and bind generated/replacement hashes. No actual source/body media is copied by the reader; external-reading/gap labels, distinct scopes and withheld inference limits remain visible.

Native source inspected, not executed: full local-link audit, no-JavaScript route/task/disclosure/source reading at root/project paths, keyboard skip/anchors/details, private-store/network preservation, five entry links and exact version navigation, unavailable/withdrawn fixtures and sampled phone/theme/enlarged-text checks. No script, completion/progress storage or private-note handling is added by the reader. Browser-capacity precheck and normal context/server cleanup are present. Initial native result, final integration checker/docs and evidence remain separate pending author work.

## Exact inspected checkpoint bindings

| File | SHA-256 |
| --- | --- |
| journeys/reader.mjs | `71bd28dd7dce9f00f454d9597dc5278f5640ef61f6f5c3e00a8f92b80a9c03ed` |
| journeys/style.css | `fdd886d9b130790dbed73e9e5dfb5095c1ad053a6f595f9e674931af801aed51` |
| journeys/releases.json | `940682500438ddc56f6a4b40df49e9f90ca10d840b920d2b986205d816454270` |
| scripts/build-journeys.mjs | `a797348b6a759b24f434f8335e5c3901379905a609322b8aca67be7d0ef0d113` |
| tests/journeys.test.mjs | `7280e776145688997391ddb66ce254e8b287be91db18bd5cccdbd6d085fa91cb` |
| tests/journeys-ui.test.mjs | `cab76b792a1eb841b29f77a2ce668a23bac2fbffc051fb43afadbc5f30bf587c` |
| docs/journeys/plans.json | `84767433923d05fbb36805629416d4e95639d795ac9ff517eada9b8f9c084cea` |
| docs/journeys/sources.json | `19bf445bdcf1af51a7231f2af839ef0a2640e1f9fc72916e8b881223605a54e1` |
| docs/journeys/targets.json | `b65b434fc43942417cfb7ddd78a5416e3e724bb915577c8c6c854f4ef83937c2` |

## Limits

Bounded AI engineering assurance, not semantic/source/rights/professional, real screen-reader or learner approval. No actual journey acceptance/publication is authorized by these checks. Original research/pilot/edition/navigation source artifacts and Wave progress remain outside mutation scope. Final repairs/test/packaging/log bindings require recheck.

## Independent repair recheck

Safe-anchor runtime guard now rejects malformed step IDs before rendering, and the section ID interpolation is escaped as defense in depth. Release review/material IDs use serialized sorted-array equality, preserving exact element/cardinality identity rather than a delimiter string. Original research files stay unchanged. Independently reran all 12 offline groups: **12/12 passed**, no fail/skip/cancel. Separately reran the original planner-accepted malicious anchor, one combined review dimension and combined adjacent material IDs; all now reject, while a valid synthetic approval still resolves 3 routes. No real approval is created.

Current independently recomputed journey delivery binding: `ae7633b4eeb422da00fb48524466b5755987c7c3829b96af8484c4342490e674`, 2,546 paths. Current source/tests in the table above are rebound. Final authored native/integration logs remain pending inspection.

## Inherited release-hardening follow-up

The same comma-delimiter material-ID comparison remains in frozen predecessors `scripts/domain-navigation.mjs:28` and `scripts/exploration-editions.mjs:62`. It can conflate adjacent material IDs into one field instead of requiring one material entry per exact ID. Those files are outside this additive reader ownership and were not edited. Parent acknowledges a separate exact-preimage delta is required. All actual edition/domain/journey release ledgers are empty; local preview can proceed, but this review does **not** approve a nonempty public-release path before inherited validation is hardened and rechecked. Keep this limitation explicit rather than treating the repaired journey validator as global release assurance.
