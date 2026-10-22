# History and literature: review and integration preparation

**October 22, 2026 · revision 0.1.1 · author-led review.** This is a further source, editorial, engineering and access check of the prototypes. The same authoring agent performed it. It does not satisfy independent content, language, accessibility or learner acceptance; `reviews` remains empty and both records remain drafts.

The [integration checkpoint](universal-pilots-integration.md) records the later local branch, whole-repository checks and final artifact hashes after whitespace cleanup. The content review and hashes below remain the earlier 0.1.1 checkpoint.

## Source and task review

- Re-read the [National Archives telegram transcript](https://www.archives.gov/milestone-documents/zimmermann-telegram), opening paragraph, and [Wilson address](https://www.archives.gov/milestone-documents/address-to-congress-declaration-of-war-against-germany), paragraph beginning “But they have played their part.” The selected phrases match. Conditional proposal, missing Mexican acceptance, rhetoric versus observed effects, source dependence and multi-cause limits remain explicit. The first claim now asks only about conditionality, so the displayed fragment supplies the direct evidence. Broader context is explicitly labeled editorial writing.
- Re-read the [Academy of American Poets Aston display](https://poets.org/poem/ancient-pond/embed) and [Hearn's “Frogs,” printed p. 164](https://www.gutenberg.org/files/42735/42735-h/42735-h.htm). Selected wording matches. The guide now describes displayed line breaks and dashes, without implying inspection of the original book layout or calling Hearn's fragment a complete sentence. Hearn's surrounding historical, linguistic and racial generalizations are not adopted.
- The [Koto display source](https://www.city.koto.lg.jp/kuse/koho/houdou/r08/r0810/r081002furuike.html) timed out in this review. No alternate-host recovery was attempted. The previous body-read receipt and exact selected-text hash are retained; no fresh verification is asserted. The display remains labeled as a modern institutional transcription, with independent Japanese review open.
- Existing selected-text reuse scope is retained. No new quoted passages, media, territory clearance or public-release claim was added. See the [source/reuse decisions](../pilots/research/history-literature-resolution.md).

## Findings and repairs

| Finding | Repair and regression evidence |
| --- | --- |
| The first history claim included context not visible in its short quotation | Narrowed it to the directly evidenced condition; editorial context is labeled separately |
| Literature wording could imply original print-layout inspection | Now describes only the selected web displays and states the edition/layout boundary |
| Source forms were always rendered as quotations | Quotation, editorial paraphrase and original explanation now have distinct labels and appropriate markup |
| The no-JavaScript guide omitted the selected evidence identifier | Added named passage links and explicit unsupported-claim descriptions |
| Skip/source anchors reset activity state through the URL parser | Native page anchors preserve selections/notes, including reload and focus transfer |
| Changing a selection left a stale share link visible; delayed clipboard failure could restore stale instructions | Invalidate the displayed link and ignore stale asynchronous responses, including permission failure |
| Corrupt saved notes could be silently overwritten | Preserve unreadable data, explain the condition and include it in explicit export |
| A blocked storage deletion was reported as successful erasure | Confirm removal before claiming it; report possible retained data when blocked |
| Revision changes stranded older notes in storage | Explicit earlier-revision export, with no automatic migration or cross-pilot storage scan |
| Control boundaries lacked sufficient contrast | Increased control-border contrast; exercised light/dark computed ratios |
| Enlarged phone text overflowed headings and long words in cards | Allowed flex headings to shrink and text to wrap inside its containers; retained failing observations and reran both themes |
| Malformed authored arrays could crash validation | Return diagnostics for malformed activity, evidence, relation and timeline payloads |
| Metadata-only receipts could enter the evidence-source allowlist | Builder now requires body/table/file access receipts for displayed evidence |
| A withdrawn preview's index could expose its former summary | Hide former title/summary in the workshop index; clarify that local withdrawal does not erase source files |

New content revisions preserve all six selected passage hashes. Stable exploration IDs, existing legacy routes and prior note-store keys remain unchanged. Reset affects only the current revision; older notes and legacy progress remain available.

## Verification and integration results

**53/53 scoped tests pass:** 18 coverage, 22 content/contract/route/rendering, three integration-preservation and ten browser groups. The final accepted-base rehearsal passed on **Node 22.23.3**, matching the repository's CI major version. The coverage validator and deterministic preview check also pass. No full production build or full application suite was run; production loading, catalog data and assets are unchanged.

Browser checks exercise 320px/1280px light/dark layouts, native keyboard controls, JavaScript-disabled reading, semantic notes descriptions, source anchors, malformed/future state, reload, private sharing, asynchronous clipboard failure, exports, corrupt data, failed deletion and earlier-revision notes. Text/control contrast checks and 200% text at 320px pass in both themes. Four readable desktop/phone source/activity viewport captures were visually inspected. These checks do not establish screen-reader conformance or learning efficacy.

Initial enlarged-text failures exposed real overflow; a later native clipboard failure exposed the asynchronous share race. They were repaired rather than weakening the assertions. The first integration UI rehearsal failed on the enlarged-text issue; the final rehearsal below supersedes it. Local failure evidence remains under `/tmp/atlas-pilot-review-20261022/` and the first rehearsal's temporary logs.

| Frozen base | Scope | Original snapshot files preserved | Result |
| --- | --- | ---: | --- |
| `facab15e297c645d4826935f2c011a4cf367ee88` | Accepted Wave 6 checkpoint, validators + 43 non-browser tests + ten browser groups, Node 22.23.3 | 5,552 | PASS |
| `8a0ca340c30596f73f47c24b437f6d989c088a57` | Expansion snapshot at review start; validators + 43 non-browser tests, Node 26.8.2 | 5,618 | PASS |
| `4b46b05a545b93cafae282dbdc69199e32235813` | Redesign snapshot at review start; same non-browser checks, Node 26.8.2 | 5,576 | PASS |

The package contains 46 explicit files. The master plan requires manual reconciliation and is not copied by the tool. Rehearsal reports retain file hashes, commands and logs in their printed temporary directories. The accepted-base Node 22 report is `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-12QT51/report.json`; rerun the documented command for a newer package/base. These are additive engineering checks, not acceptance of concurrent chapter content.

| ID | Revision | Content digest | Artifact digest |
| --- | --- | --- | --- |
| `x-history-0001` | `0.1.1` | `6a1aaf4c32b5dbf2603b4f3de469297a0a42abe0efbb2eff1d0026cc272043db` | `de15c0d88e0071be6c74f4312bfefa74a7fea0242615845ba16f6a88ca5c4f8c` |
| `x-literature-0001` | `0.1.1` | `b562d61ebf5ca44e5e9981c44f24f2203b0b84ba1c5cd975d5a433d9e4084df0` | `417f879a25d841bd40a1d2d0eb073085cb445c8f185fa85ab2c73256d05d3933` |

All six passage hashes are unchanged from 0.1.0. The artifact digests bind the current preview code and authored content, not a deployment or a human approval. Future integration must rerun generation against the destination metadata and inspect any output differences. Documentation receipt finalization after the rehearsal does not change these code/content digests.

## Preservation and remaining gates

The task began with a hash baseline of 3,217 tracked/untracked root files. Other worktrees were read only; frozen Wave 6 chapter assignments were recorded before work. No message was sent to either chat. Review/integration preparation does not rewrite their ledgers or count author-verified items as independently accepted.

The final preservation check found only 21 intended existing package/master-plan paths changed, with no unexpected baseline changes. Original content, assets, README, production scripts/data, the Revision 2 archive and unrelated dirty/untracked files retain their starting bytes. All local Markdown targets in the 22 package/master-plan documents resolve.

Expansion remained at `8a0ca340…` during the preservation snapshot. Redesign advanced independently to `9f7bf4bef2043ef8b8a59aa6881a15c65fb91b68`; its changes are confined to ALG8 content/helper, redesign ledgers and ALG tests, outside this package. The table records the earlier frozen snapshot actually exercised, not an invented test of the later commit. Shipping remains at `f0a324f98f5f7f2538f7685b84d1041764a65828`. The frozen chapter payload hash remains `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af` in all three worktrees, using Python `json.dumps(chapters, sort_keys=True).encode()`.

No screen reader, external subject reviewer or learner participant was used. No publication or live production integration occurred. Use the [integration package](../integration/universal-pilots.md) and [continuation handoff](../master-plan-handoff.md) for the next boundary.
