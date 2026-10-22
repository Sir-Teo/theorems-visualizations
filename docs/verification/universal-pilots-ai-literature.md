# Independent AI review: literature pilot 0.1.1

Date: 2026-10-22. Reviewer: Codex literature_review subagent, a separate AI review process commissioned by the integration owner under the user's authorization. Role: bounded source/text and English close-reading reviewer. This reviewer did not author or edit the pilot. No professional Japanese-literature, legal or accessibility credential is asserted.

## Exact candidate

Repository: `/Users/teodev/.codex/worktrees/universal-pilots-integration/theorems-visualizations`.
Baseline supplied: `d638f2ec39435b5ef04439f72d46f5be5da6f54c`.
Record: `x-literature-0001`, revision `0.1.1`, draft/local-preview.
Content digest: `b562d61ebf5ca44e5e9981c44f24f2203b0b84ba1c5cd975d5a433d9e4084df0`.
Artifact digest: `70c9d0d487e0fc4d5f55a99a058ab20e2295794b2fd868c68a49257d53cf7385`.

The read-only builder check (`/tmp/atlas-ci-node22-20261020/node scripts/build-explorations.mjs --check`) independently returned these digests and succeeded. No repository files were modified and no browser was launched. The report itself is outside the repository.

## Methods and independently accessed evidence

Read the canonical JSON, selected source receipts, source/reuse decisions, review-session protocol, authoring guide and schema/URL contract. Inspected the renderer's source-card labels and annotation-guide construction as text, without claiming browser or assistive-technology observation.

Independently opened the following allowed sources with the web tool on this review date:

1. [Academy of American Poets selected Aston display](https://poets.org/poem/ancient-pond/embed): poem body, translator credit, edition credit and explicit public-domain statement. Returned source lines 12–24 supply these elements.
2. [Project Gutenberg Hearn HTML](https://www.gutenberg.org/files/42735/42735-h/42735-h.htm): title-page date/copyright information (returned lines 24–32), and the rendition in “Frogs” at printed page 164 (returned lines 1291–1296).
3. [Project Gutenberg catalog 42735](https://www.gutenberg.org/ebooks/42735): catalog title/author, ebook number and US public-domain field (returned lines 38–54). The automatically generated catalog summary was not used as literary evidence.

The Koto URL was deliberately NOT requested. Its retained receipt records an earlier body reading, then a failed recheck and a binding retrieval stop. This review inspected the local receipt and selected text only; it supplies no new remote verification of the Japanese display. No denied, timed-out or CAPTCHA source was retried, and no alternate-host recovery was used.

## Findings

No actionable defect was found within the bounded, independently checked English-text and selected-source scope. The following are observations supporting that conclusion, rather than claims of general acceptance.

| Checked feature | Observation and evidence |
| --- | --- |
| Aston wording and attribution | `explorations/literature.json:45` and `:103` identify the Academy display, translator and credited 1899 work. The selected three-line text and punctuation at `:106` match the displayed poem. The context explicitly attributes formatting to this selected web display rather than to an inspected print facsimile. |
| Hearn wording and edition | `:66`–`:73` and `:113`–`:120` distinguish the selected 1914 edition from the 1898 copyright date. The word “jumping” and the punctuation inside the quotation match the primary HTML text at printed p. 164. The omission of enclosing quotation marks and parentheses is disclosed. No source-authored three-line layout is invented. |
| English number comparison | `:167` is a direct observation of the two selected English forms. The readings at `:170`–`:173` use modal language, do not force a simultaneous scene and explicitly withhold a Japanese-number conclusion. This is defensible as an English close-reading task. |
| Movement/sound comparison | `:178` accurately describes phrase order in the selected renderings. The guide distinguishes order of wording from a reader's imagined event sequence; both proposed responses remain possibilities. |
| Punctuation comparison | `:189`–`:195` accurately distinguish the selected displays, qualify possible effects and disclaim reconstruction of print layouts or Bashō's punctuation. |
| Transfer and rubric | `:198`–`:202` require evidence and separation of textual observation from original-language/biographical inference. The text does not claim that an English plural proves the number of animals Bashō saw. The response remains open rather than auto-scored. |
| Historical Hearn context | `:158` excludes the surrounding essay's historical and linguistic assertions from adopted claims. The source excerpt indeed sits amid broad historical/linguistic generalizations; this pilot does not require treating them as established facts. |
| Japanese witness boundary | `:125`–`:129` agree with the retained local receipt's exact selected string and hash. The pilot labels it a modern institutional display, distinguishes it from a facsimile/critical edition, and makes no Japanese grammar, pronunciation, mora/syllable or translation-fidelity determination. This review confirms internal consistency of those limits only. |
| Bounded prototype reuse | `:52`–`:60` and `:73`–`:81` restrict reuse to selected historical text and explicitly exclude contemporary site/media assets. The Academy statement and Gutenberg US status support the stated US text-only prototype basis. `:90`–`:97` similarly exclude municipal modern commentary/media. This is a bounded evidence check, not legal clearance for public distribution or all territories. |

No content or source-text repair is requested on this version. Retain the existing Koto stop and witness limitations. If original-language interpretation, manuscript history, a pronunciation recording, a modern translation, an image, a public route or a wider distribution territory is added, review that new scope before claiming it is covered by this receipt.

## Results and open gates

- English quotation/edition/source check: PASS within the selected web texts inspected above.
- English comparison/language reasoning: PASS within the English-only task and its explicit limits.
- Selected-text rights-evidence check: PASS for the stated bounded US local prototype evidence. This is not a legal opinion or public-release authorization.
- Japanese display's fresh source verification: NOT OBSERVED; retained prior receipt only, binding stop preserved.
- Japanese specialist review: NOT PERFORMED; no professional specialist credentials claimed.
- Actual screen-reader task review: NOT OBSERVED.
- Formative learner task/transfer observation: NOT OBSERVED.
- Public-distribution rights review: NOT PERFORMED.

This supplemental AI receipt can document the user-authorized independent AI review. It must not silently satisfy screen-reader or formative-learning requirements, claim recruited specialist approval, or change the pilot to accepted. Keep those unobserved gates explicit. Any change to the content digest or bound artifact requires a fresh exact-version check before this review is used to support that changed candidate.

## Recheck after collection-label artifact binding

Date: 2026-10-22. Same independent AI reviewer and role/scope as above. Inspected the final diff against the supplied baseline for `explorations/contract.mjs`, `scripts/build-explorations.mjs` and `explorations/literature.json`. The literature JSON has no authored-content diff. The two code changes add the rendered related-collection title mapping (including the renderer's ID fallback) to the artifact digest and use that same mapping for validation, reporting and rendering. This closes a version-binding gap without changing the selected passages, activity or source/rights decisions. No defect was found in this delta within this review's scope.

Read-only `scripts/build-explorations.mjs --check` succeeded again using Node 22.23.3 and independently returned:

- ID: `x-literature-0001`; revision: `0.1.1`; status: `draft`.
- Unchanged content digest: `b562d61ebf5ca44e5e9981c44f24f2203b0b84ba1c5cd975d5a433d9e4084df0`.
- Current artifact digest: `182f56098fe2684c55f6e35d1e9e40c982fb7ebf74fe8be6fa720be464a2b3b2`.

The findings and limits above now apply to this current artifact digest. The earlier digest is retained as review history and must not be used for the current candidate.

Explicit bounded dimension conclusions:

- **Content: passed** for the selected text, edition attribution, source labels, English comparison claims, interpretive openness and stated task boundaries reviewed here.
- **Language: passed** for observable English wording/order/punctuation and the handling of Japanese witness limits. This is not fresh source verification of Koto, a Japanese-language specialist review, or approval of original-language interpretation. The retained Koto receipt remains the only inspected evidence for that display; its retrieval stop remains binding.
- **Rights: passed** for the selected historical text and documented text-only US local-prototype evidence and exclusions. This is not legal clearance or approval for public distribution, new assets or wider territories.

It is honest to record these three narrowly scoped passes with this AI identity/role and this report as durable evidence, provided their limits remain visible. They do not support an unrestricted claim of professional specialist or legal approval. Accessibility and learning receipts must remain absent until the required actual observations exist. Both pilots remain drafts and unaccepted. No additional sources were retrieved, no browser was launched, and no repository file was modified by this recheck.
