# Independent AI engineering review — 30-domain orientation preview

October 22, 2026. Reviewer: separate Codex AI engineering reviewer `code_review`, independent of the authoring process. Read-only integration-checkout inspection; no browser, production build, authored edits or external retrieval.

## Actionable finding

**P2: malformed representation-gap keys pass validation and crash rendering.** `orientation/contract.mjs` validates the required place/language/practice values but permits extra keys. `orientation/render.mjs` iterates all keys and calls `k[0].toUpperCase()`. Add `representationGaps[""]="extra gap"` to the first otherwise valid record: `validateOverviews()` returns no errors, then `renderOverview()` throws TypeError. Require a plain object with supported nonempty keys and text values (prefer exactly the declared three keys), or safely handle extra keys. Add a regression for this accepted-but-unrenderable payload.

Initial result: changes requested for this bounded schema/render robustness issue. No currently authored gap key was found malformed.

## Candidate hashes independently verified

- Content: `85f9cc98335776b33950c123a28b476c1bcb13e552f3599358c8eda8d2477680`
- Artifact: `3cb1092ed1718688c361325f2c47f32b5f9b82b82d59da939d4b07a041513b3d`

Computed through the current contract using the complete 30-domain projection and five current builder/renderer/UI/style/contract hashes, not copied as an assumed match.

## Methods and results

Read orientation contract/render/UI/style, isolated builder, source/overview catalog structure, generated-route tests and review binding tests. Independently ran `node --test tests/domain-overviews.test.mjs` on Node 22.23.3: **16/17 pass**. The remaining test currently fails only because the linked `docs/coverage/overviews.md` is still being authored by the owner; this known packaging task was explicitly pending at review start. No runtime browser tests performed by this reviewer. Performed the malformed gap-key reproduction in memory.

## Inspected properties with no other actionable finding

The catalog enforces exactly the 30 registered domain identities, local-preview publication, explicit editorial framing, bounded inspected-source/next-step relationships, representation gaps and no activity/lesson-acceptance/prerequisite fields. Relevant source records require HTTPS URLs without embedded credentials, body-read locators and dates, scope/reuse/limit text; unavailable source URLs cannot support an overview.

Content review projection binds source text/access, domain title/method/gap/stewardship context, overview reading tasks and neighbors, resolved collection titles/relationships and pilot identity/revision/status. Artifact additionally binds the complete orientation implementation. Latest per-domain source-content/engineering receipts must match their scoped content digest, engineering must match the current full artifact, and independent AI reviewer identities must differ from author and each other. Evidence paths stay inside the orientation review directory and reports must name exact digests. Review metadata avoids circular hashing. Structural checks do not establish factual expertise or whether a reviewer actually read a source.

Rendered text and source URLs are escaped. Domain IDs and local collection/pilot route components are constrained before rendering; generated root/project-prefix route checks cover local links. Filtering uses textContent and hides existing cards, accepts no HTML, persists no search query or private notes and makes no network requests. Complete navigation and content exist in HTML without JavaScript. Native controls, live result count, no-result prompt, skip link and focus styles support later runtime review; source inspection does not prove assistive-technology success.

Pages explicitly distinguish orientation from curriculum, collection presence from full-domain coverage, local pilot states from production acceptance and scoped AI review from professional/community/learner approval. The isolated builder writes only labs/atlas/domains output and refuses unexpected directories. It reads existing collection/pilot metadata without mutating the six pilot records or their artifact bundle. No production runtime/content alteration or broader taught-coverage claim is inferred.

## Limits

Independent engineering inspection only. Source-content accuracy requires its separate reviewer. Actual screen-reader announcements, learner observation, professional/community approval and full curriculum coverage were not observed or granted. Recheck after the reported schema repair and final packaging freeze before recording a final engineering receipt.

## Independent repair and packaging recheck

The P2 is resolved: representationGaps now requires an object with exactly place/language/practice keys and text values. The original empty-key reproduction is rejected before rendering; a dedicated regression covers unsupported keys. The previously pending overviews.md link now exists.

Independently reran the full offline orientation suite: **18/18 pass**, zero failures/skips/cancellations, including generated reproducibility, malformed structures, exact evidence binding and root/project-prefix file routes. Independently recomputed:

- Unchanged content digest: `85f9cc98335776b33950c123a28b476c1bcb13e552f3599358c8eda8d2477680`.
- Current artifact digest: `17d23371bbbe39d175dc12b71ed6e84758005e884a900ef629795334ae067f17`.

**Bounded independent AI engineering review passes for this exact content/artifact.** No further actionable engineering finding found. This report supports only the engineering dimension for all 30 domain orientations; source-content review is separate. Browser tests, real learner or assistive-technology sessions and professional/community approval were not performed by this reviewer. Integration-manifest wiring was still being prepared by the owner at this checkpoint; changes outside the orientation artifact require their appropriate final packaging checks and do not imply production publication.

## Final additive packaging recheck

Independent read-only final packaging audit passes with no actionable finding. Confirmed all **132 manifest entries are unique existing files**, and all **41 required orientation implementation/catalog/documentation/test/generated-page paths** are present; no orientation omission found. The three exact orientation review reports are also included in the manifest. The allowlist adds the isolated orientation directory and named builder/tests while retaining refusal of production paths and differing destination bytes. Master-plan reconciliation remains explicit.

Independently compared all **5,552 regular files** from the accepted `facab15e297c645d4826935f2c011a4cf367ee88` archive against the current integration checkout: the sole changed existing path is MASTER_PLAN.md, whose original bytes are retained exactly in docs/integration/universal-pilots-baseline-plan.md. Thus production runtime/content files remain byte-identical to that accepted base. This compares the accepted base, not the other chats' unaccepted newer work.

Read the supplied preflight report: four offline commands passed against the pinned temporary snapshot, including both builders and the 89-test offline selection. Those prior executions are owner-provided evidence. Independently ran the three integration-overlay safety tests: **3/3 passed**; independently ran the final orientation builder in check-only mode: **31 reproducible pages, reviewed-local, local-preview**, with unchanged exact content/artifact hashes above and valid installed evidence files.

Browser suites in preflight are invoked as two sequential execFileSync commands; each suite creates one browser and closes it in its after hook. This preserves one browser lane for this task rather than running both suites concurrently. This reviewer launched no browser and does not reclassify owner UI evidence as independent human observation. Package remains local preview with the documented limits and no production deployment or full-domain taught-coverage claim.
