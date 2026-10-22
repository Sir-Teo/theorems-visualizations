# Independent AI review: history pilot

Date: 2026-10-22.
Reviewer: `atlas-ai-history-review` (separate Codex AI reviewer, independent of the authoring agent for this review). This is an AI source/content/provenance and bounded reuse assessment; I do not claim historian or lawyer credentials, legal clearance, screen-reader observation or learner evidence.

## Exact candidate

Worktree: `/Users/teodev/.codex/worktrees/universal-pilots-integration/theorems-visualizations`.
Baseline commit: `d638f2ec39435b5ef04439f72d46f5be5da6f54c`.
Pilot: `x-history-0001`, revision `0.1.1`, draft/local-preview.

The read-only command `/tmp/atlas-ci-node22-20261020/node scripts/build-explorations.mjs --check` succeeded and reported:

- Content digest: `6a1aaf4c32b5dbf2603b4f3de469297a0a42abe0efbb2eff1d0026cc272043db`.
- Artifact digest: `8f814e4b133f508639df0be35d30fac37b98960873ff10452c0eaf1f1cab035f`.

No repository file was modified. No browser was launched, no external person/chat was contacted, and no subagent was spawned.

## Method and material inspected

I read the complete `explorations/history.json`, relevant source receipts in `docs/coverage/sources.json`, `docs/pilots/research/history-literature-resolution.md`, the review-session protocol, `docs/exploration-authoring.md`, `docs/architecture/universal-schema-urls.md`, the integration verification checkpoint and relevant renderer/contract sections. I compared every selected history quotation, contextual explanation, claim, answer guide, chronology and transfer task against the permitted institutional source text. I did not inspect scan pixels, the German original or the whole intelligence chain.

Independent web reads, all successful on 2026-10-22:

1. [National Archives: Zimmermann Telegram](https://www.archives.gov/milestone-documents/zimmermann-telegram). Inspected citation and transcript, particularly transcript opening paragraph and following instruction. This is the actual displayed English decoded-message body, rather than only search metadata.
2. [National Archives: Wilson address](https://www.archives.gov/milestone-documents/address-to-congress-declaration-of-war-against-germany). Inspected date/citation and the transcript paragraph beginning “But they have played their part,” with surrounding argument. Actual body read.
3. [National Archives copyright FAQ](https://www.archives.gov/faqs#copyright). Inspected the Copyright section. Actual body read.

No stopped, denied, CAPTCHA or timed-out source was reopened; Koto and other unrelated stops were outside this review.

## Required repair

**H-R1 — P2, source-registry reuse scope contradicts the selected prototype.** `docs/coverage/sources.json:164` (`telegram`) and `:181` (`wilson1917`) both retain “Reference and original paraphrase only; assets require a separate rights check.” The current pilot instead embeds short attributed quotations and records that decision in `explorations/history.json:52` and `:71`, with a consistent decision in the research resolution document. The central receipts are presented as current source/reuse records rather than explicitly historical pre-selection plans. A future integrator cannot tell whether quotation is within their authorized asset scope.

Repair: align those two receipt plans with the actual selected text-only, US local prototype decisions. Preserve the distinction between the telegram's foreign-origin English witness and the official presidential speech; preserve excluded scans, website prose/design and audio/video, and the requirement for release-specific review. Do not expand this into blanket permission. This is a documentation/metadata consistency defect; I found no evidence that the authored quotations themselves need replacement. Source-registry edits do not alter the displayed content digest, but the integration owner should verify that expectation and re-run the registry validator.

Result at this candidate: **changes requested for receipt consistency**. No historical content or provenance correction requested.

## Supported content/provenance findings

The telegram's two exact selected phrases match the NARA transcript and total 15 words. The surrounding transcript connects the condition to the aim of maintaining US neutrality and instructs a diplomatic recipient. The pilot's explanation therefore fits this witness. The month-level date is suitably bounded; the pilot does not invent an exact transmission date or claim a scan/manuscript inspection. [NARA telegram](https://www.archives.gov/milestone-documents/zimmermann-telegram).

The selected Wilson clause matches the transcript; its continuation names the intercepted note. The pilot reasonably treats the speech as evidence of Wilson's public argument and makes audience effect an inference. Its dependence warning prevents the two documents from being counted as independent confirmations. The April 2 date agrees with the archive. [NARA address](https://www.archives.gov/milestone-documents/address-to-congress-declaration-of-war-against-germany).

The four task guides fit their claim scope. The conditional-language task can be answered from the selected phrase. The acceptance and sole-cause tasks correctly say the pair does not establish those claims; the feedback does not turn missing acceptance into rejection. The rhetoric task permits interpretation while disclaiming measured public effect. The transfer question asks for provenance rather than treating repeated publication as automatically independent evidence. These are review judgments about task design; no reader response was observed.

The current labels disclose the English witness, missing German original/interception chain and missing Mexican response. The pilot does not adopt the archive webpage's broader editorial summary about declarations against Germany and allies. I found no unsupported certainty that requires a content repair within this deliberately small corpus.

## Bounded reuse assessment

NARA's FAQ distinguishes generally usable government records from potentially copyrighted donated/other material and assigns users responsibility for determining restrictions. It supports the pilot's refusal to treat every hosted record/image as cleared. [NARA copyright FAQ](https://www.archives.gov/faqs#copyright).

The prototype's short, attributed critical extracts and original surrounding explanations are a bounded use assessment, not an item-specific license or a legal determination. I found no copied scan or modern archive editorial prose in the JSON selection. The government-speech and foreign-origin decoded-text bases are distinguished. Keep the existing US local prototype scope and wider-distribution gate. Shortness alone should never become an automatic rights rule for future pilots.

## Limits and gates left open

- Actual screen-reader task review: **not observed**. No DOM inspection or automated test substitutes for it.
- Formative learner observation and transfer performance: **not observed**.
- Subject-professional credentials or expert recruitment: none claimed. This AI review covers consistency and institutional text checking within its stated scope.
- Public distribution, additional jurisdictions, complete translation reuse, scans, later editions/media and withdrawal/update stewardship: **not cleared by this review**.
- Source-authenticity research beyond the named institutional transcript bodies: outside scope; missing chain already disclosed to readers.

The pilot should remain a draft while required acceptance evidence is absent. This report may be retained as supplemental independent AI evidence; it must not be used to mark unobserved accessibility or learning dimensions passed. Recheck this finding after repair and bind any final receipt to the then-current candidate digests.

## Repair recheck, 2026-10-22

The integration owner changed the two `rights.plan` entries. I reread the exact edited entries: telegram now scopes the two short attributed phrases/15 words and excludes full translation, scans, modern editorial copy and other site assets; Wilson now scopes a short attributed official-address quotation with corresponding exclusions. Both retain wider-distribution review. **H-R1 resolved.** `node scripts/validate-coverage.mjs` passes (30 domains, 85 primary collections, 42 source receipts, 8 pilot briefs).

Explicit bounded dimension conclusions after this repair:

| Dimension | AI review conclusion | Scope |
| --- | --- | --- |
| content | passed | Exact selected institutional wording, authored historical/interpretive claims and answer-guide consistency within the disclosed small corpus |
| provenance | passed | Identified English witness, locators, date precision, source dependence and disclosed missing original/chain/Mexican response |
| rights | passed | Consistency and bounded basis of the documented text-only US local prototype assessment; no legal clearance, professional opinion or wider-release permission |
| accessibility | not observed | No actual screen-reader task session conducted |
| learning | not observed | No learner session or transfer response collected |

These can be represented as scoped AI receipts with the actual AI identity/role and this durable evidence path, provided acceptance/publication is not implied and the unobserved required dimensions remain open. If the workflow interprets `rights: passed` as legal or public-release clearance beyond the prototype scope, retain it as supplemental-only instead; do not broaden this conclusion. Final receipts must bind the final frozen artifact; rendering/code changes were still possible when this recheck was written.

## Final artifact recheck, 2026-10-22

I inspected the current Git diff for `history.json`, `contract.mjs`, `build-explorations.mjs`, the related regression and the repaired source receipts. History's reader-facing JSON is unchanged. The code change adds the actual rendered related-collection titles (including the renderer's ID fallback) to the review artifact digest, using the same title map for validation, rendering and reported hashes. It does not alter the history passages, task guides, source links or scope. The regression checks that a displayed label change invalidates a review while unrelated collection metadata does not. No new source retrieval or browser session was needed or conducted for this delta.

I reran `/tmp/atlas-ci-node22-20261020/node scripts/build-explorations.mjs --check`; it passed and reported this final checked candidate:

- ID: `x-history-0001`; revision: `0.1.1`; status: `draft`.
- Content digest: `6a1aaf4c32b5dbf2603b4f3de469297a0a42abe0efbb2eff1d0026cc272043db`.
- Artifact digest: `87d5558bfd38472fe904c3bc37d413a53458cc6ecd0af5933e9659e3d2282899`.

The bounded **content / provenance / rights** AI review passes apply to these final hashes with the scopes and exclusions recorded above. H-R1 remains resolved. This is suitable for three receipts identifying `atlas-ai-history-review` as an independent AI reviewer, with the actual bounded role and the durable copied report path. **Accessibility and learning remain unobserved; independent overall acceptance and public release are not asserted.**

## Revision 0.1.2 scoped recheck, 2026-10-22

The integration owner relayed the user's explicit decision to remove the screen-reader and learner checks as acceptance requirements. This section supersedes earlier statements that those sessions must remain acceptance gates; it does not turn those unperformed sessions into passing observations.

I inspected the current Git diff read-only and ran the current builder's `--check` successfully. I also compared the parsed current history JSON with `HEAD:explorations/history.json`: `sources`, `passages`, `claims`, `context`, `timeline`, `activity` and all historical `reviews` are exactly unchanged. The current declared dimensions are `content`, `provenance` and `rights`. The revision increments to 0.1.2; `previousRevisions` now includes 0.1.1 as well as 0.1.0 so earlier notes remain explicitly exportable. A reader-visible `reviewLimitations` message states that screen-reader and learner sessions have not been performed. No new source retrieval or browser session was needed or performed.

The contract still enforces content/rights as minimum dimensions and enforces every declared dimension for accepted records; provenance remains explicitly required for this history pilot. The renderer escapes and shows the limitations, describes acceptance as reviewed for local preview, and keeps public release separate. Nothing in this delta supplies human observation, legal clearance or professional qualifications. Historical receipts remain intact and must not approve the new revision without a fresh exact-version receipt.

Final candidate checked:

- ID: `x-history-0001`; revision: `0.1.2`; status at recheck: `in-review`; publication: `local-preview`.
- Content digest: `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af`.
- Artifact digest: `ffef0964100bbcdd7496cc798bea195a912d93375c4e2b892e4a656736e8dce4`.

**Final bounded AI conclusions for revision 0.1.2: content passed; provenance passed; rights passed.** These conclusions carry the same specific corpus, institutional text-checking, prototype-only reuse scope and limitations explained above. The revision/review-policy/display delta introduces no defect in those checked dimensions. H-R1 remains resolved. Fresh scoped receipts may identify `atlas-ai-history-review` as an independent AI reviewer and bind these exact hashes. Screen-reader and learner sessions remain explicitly unperformed, without passing receipts or efficacy claims. This review does not authorize public distribution or assert legal/professional clearance.


# Independent AI recheck: history under expanded method code

Date: 2026-10-22.
Reviewer: `atlas-ai-history-review`, separate AI source/content/provenance reviewer. Bounded text-only US local prototype reuse assessment; no historian/lawyer credential, legal clearance or public-release authorization claimed.

Candidate: `x-history-0001`, revision `0.1.2`, `accepted` / `local-preview` lifecycle labels. Those labels describe the repository state, not a broader certification by this review.

## Scope and exact hashes

I read the diff since `e3b85eb1` for the shared contract, renderer, browser UI, state helpers and builder, and read the new method module dispatch relevant to history. I inspected `/tmp/atlas-next-review-pages/x-history-0001.html` as HTML text. I did not launch a browser, retrieve sources, edit repository files, contact other chats or spawn reviewers.

I independently recomputed canonical SHA-256 using Node's crypto, a separately written canonical JSON serializer, actual current bytes for all nine builder-listed code files, and related labels from the current registry. I did not rely on the reported temporary JSON hashes alone. Computed values agree with `/tmp/atlas-next-pair-digests.json`:

- Content digest: `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af`.
- Artifact digest: `9d0101eb73f6bb3f964aeeaae46c642129928658640872fe82e514e30c143b75`.

I also rendered this candidate in memory using the current renderer and real collection labels; its output exactly equals the supplied review HTML. The supplied HTML is therefore current for the inspected artifact. This verification is not a claim that the normal build passed: old acceptance receipts are stale against the new artifact until fresh reviews are appended.

## Findings and decisions

**No required repair found for the bounded history review.** Entire parsed `explorations/history.json` equals its `e3b85eb1` version, including selected passages, sources and asset/reuse decisions, contextual limitations, task/answer guides, chronology and review limitations. The prior independent institutional body checks and source-scope repair remain the evidence basis; no fresh remote verification is claimed.

The common heading changes (all pilot explorations, explore the evidence, exploration limits) accommodate the additional pilots without changing history's claims. History still dispatches through its existing source-comparison renderer before the new method path. All three quotations and their source/reuse detail sections remain present; conditionality, nonacceptance inference, rhetoric/causation boundaries and the newspaper provenance transfer prompt remain intact. Related collection names and routes remain the same.

The shared state normalization's new-method helper returns an empty object for history; the existing history state branch is preserved. The new UI apply helper performs no method-specific operations for history. The shared select listener still includes history's existing controls. These observations support compatibility within this review's scope; a separate engineering reviewer owns comprehensive runtime verification.

The rendered page preserves the visible disclosure that screen-reader and learner sessions have not been performed, the local-preview label, and the separation between review scope and public release. It does not imply human observation or learning efficacy.

| Dimension | Final scoped AI conclusion |
| --- | --- |
| content | passed — unchanged institutional selections, authored claims and task guides still render without an unsupported historical assertion introduced by this delta |
| provenance | passed — named English witness, source links/locators, date precision and disclosed dependency/missing-chain boundaries remain intact |
| rights | passed — same documented short-attributed-text US local prototype scope and exclusions remain intact; this is not legal or public-distribution clearance |

Fresh scoped receipts can bind these exact hashes and identify this AI reviewer and report. Historic receipts should remain appended and unaltered. Actual screen-reader and learner observations remain unperformed; the user's removal of those acceptance requirements does not fabricate their completion. No conclusion extends to newly authored P03/P05 content, foreign jurisdictions, complete translation reuse, scans or additional media.

## Final shared validator correction recheck, 2026-10-22

The follow-up change validates measured-data omittedColumns and retained row projection in method-models.mjs. I inspected those checks: they are confined to the measured-data branch, with no new source-comparison behavior. History content remains unchanged. I independently recomputed hashes again and verified the refreshed review HTML equals the current history renderer output.

- Content digest: `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af`.
- Artifact digest: `bea7f7e523e89e0c36dec0c0bcf66c681dc1ccde92c05cd48079b8e1ad193eef`.

The scoped AI content, provenance and prototype-rights conclusions remain **passed** for these final hashes, with all prior limitations retained. No source retrieval, browser session or repository edit was performed for this recheck. These passes supply no professional/legal/public-release clearance and no human session evidence.


## Readable chart final recheck

Date: 2026-10-22. Reviewer: atlas-ai-history-review (same bounded independent AI role). The shared method view/style change places the soil plot at readable minimum width in a named focusable scroll region; argument UI text now includes complete selected premise/action text. I inspected the relevant code delta. Those method-specific paths do not change history sources, quotations, tasks, provenance or reuse decisions. History's content digest remains identical, and its freshly rendered HTML exactly matches the refreshed supplied review HTML.

Independently recomputed final hashes:

- Content: `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af`.
- Artifact: `c002df87d23466b1bcfafea21f67a2db7a294dc2b4118b7aaf701220210b8033`.

Scoped AI **content / provenance / rights: passed** for this exact history artifact. The rights conclusion remains limited to the documented text-only US local prototype, without legal/professional or wider-release clearance. Screen-reader/learner sessions remain unperformed, with no fabricated observation. No browser, source retrieval or repository edit was performed for this recheck.


---

# History recheck after studio additions

Date: 2026-10-22. Reviewer: atlas-ai-history-review, independent AI source/context and conceptual-model reviewer. No practitioner, historian, lawyer or accessibility-observer credential is asserted.

I inspected the final shared code relevant to this candidate, the current JSON and refreshed HTML. I independently recomputed canonical SHA-256 using a separately written serializer, actual bytes of all thirteen builder-listed files and actual related collection labels. The hashes match the supplied candidate digest file. In-memory rendering exactly matches the supplied review HTML; selected-text hashes and visible review-limitations text also match. No browser, repository edit, source retrieval, other-chat contact or nested reviewer was used.

- ID/revision: x-history-0001 / 0.1.2.
- Content digest: `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af`.
- Artifact digest: `451251379199fcc10fda552dc6e27c227fc87b0b4e986a6d9ae17da84e4c37ec`.

## Findings and decisions

No required repair found for the bounded history review. History content digest is unchanged from the already checked revision 0.1.2. Thus the source/passage selections, quotations, source/reuse metadata, answer guides, context, dates and task remain identical. The new studio method branches and performance WAV metadata do not replace the history source-comparison branch. The refreshed static page retains the quotation/context distinction, source and reuse details, source-dependence warning, missing Mexican reply/causal-chain limits, original newspaper-transfer task and disclosure of unperformed human sessions. Table-layout changes do not alter those historical claims.

This report supplements the prior independent NARA body checks and /tmp/atlas-history-methods-recheck.md; it does not assert new remote verification. Scoped AI **content / provenance / prototype-rights: passed** for these exact hashes. Rights remain limited to the documented short-text US local prototype assessment. No historian/lawyer clearance, public-distribution approval, screen-reader or learner observation is asserted.
