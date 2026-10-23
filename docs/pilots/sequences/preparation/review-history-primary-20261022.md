# Independent captured-source/editorial review: P01-L02 primary preparation

Reviewed 2026-10-22 by `history_review`, independent AI source/editorial desk reviewer, separate from the author. Final scoped conclusion: no remaining actionable source/editorial defect identified in the repaired preparation packet. This is a captured-body reading review, not professional historical approval, original-language review, manuscript/print authentication, legal clearance, final lesson/rubric acceptance, learning/access observation or release authorization.

## Current exact bindings and material reviewed

| Item | SHA-256 |
|---|---|
| `history-primary-20261022.json` | `5f7646201da8cc42f6924e24d17d02346730639f71f7bffe6f10643c3d8fdea5` |
| `history-primary-20261022.md` | `e9c6f4c58148fbc9a28aed420409c1c7093deaa0679a916e9905674cfdb0f147` |
| Captured `d39.html` (69,463 bytes) | `927d9fcf2b02ccdd24c4ede7b92223318f208c8ceca4542abd06537f94e7d034` |
| Captured `d59.html` (68,555 bytes) | `c5b6b4199c62f3d8d13aeeaed34584f49c04b15a3340b40d22883f688e19d63f` |
| Captured `d300.html` (62,247 bytes) | `159d9ef62967dccfc21007beed5ab5b48d46e2711cd2e28915c2ad3846f32fe9` |
| Captured `volume.html` (56,762 bytes) | `7354f12598e1dd8c1a44a74449914701124c8c98ef1b14bde731885976a003a3` |
| Captured `frus_rights.html` (25,247 bytes) | `bafa9506719bb1a452d53b21844549fb6158ca47256452baf522133effa14f95` |

The five captures are under `/tmp/atlas-history-primary-20261022/`. All actual byte counts/hashes match the dossier and local download manifest. I read the three selected document bodies, including surrounding unselected paragraphs and headings/datelines/signatures, and the relevant volume metadata and FAQ body. The snapshots identify the stated works; the same-URL/download history is retained author evidence, not a newly observed network transaction by this reviewer. No fresh source was fetched.

Independently parsed the HTML using a new standard-library `HTMLParser` implementation written for this review, restricted to document IDs `d39`, `d300`, `d59`. Removed the stated page-marker anchors and footnote-reference spans, decoded entities and collapsed block/whitespace boundaries. Did not run the author's `extract.py`, `prepare.py` or rely on `bodies.json` for the result. Each of eight selected strings occurs exactly once in the independently normalized relevant document, and every selected UTF-8/no-final-newline SHA-256 matches its dossier field.

All six `existingBindings` also match actual local files: the original perspectives brief, shared sources, queue, README, canonical history pilot and coverage registry. This verifies preservation against the declared byte bindings, not a new acceptance or comprehensive audit of those files.

## Source fidelity, dates and evidentiary boundaries

**Document 39:** The captured heading identifies De Negri as the Mexican consul general in charge of Mexican interests writing to the Secretary of State, file 763.72119/468. The body displays `[Translation]`, Washington February 12, 1917, the nested Querétaro February 11 date, Carranza's direction, Aguilar's named signature and De Negri's transmission. No English translator is named in the inspected document. The dossier correctly separates transmission, enclosed note, translation and later publication; it does not assign a translation date or treat De Negri as translator.

The three selections preserve the actual diplomatic proposal: concerted neutral invitation/mediation, then proposed restrictions on supplies and commercial relations if peace is not achieved; the cooperation paragraph names influential neutral countries and represents Mexico's capacity diplomatically. These establish stated policy and self-presentation, not implementation, public consensus, German-alliance acceptance/rejection or an unmediated Spanish original. The historical spelling/capitalization in selections, including “Would,” is not silently modernized. The unselected paragraphs' moral/legal assertions remain the note's assertions rather than conclusions adopted by this packet.

**Document 300:** The captured dateline explicitly displays Mexico City March 10, 1917, 10 a.m., and receipt March 11, 2 a.m. Its file number is 862.20212/89. The dossier does not infer a destination time zone. The three selected spans occur in the first body paragraph and accurately distinguish Fletcher's report of Carranza's assertion, his account of a hypothetical question, and his explicitly personal prediction/motive inference. Surrounding paragraphs also contain Fletcher's assessment and guarded reported conversations; they do not supply an authenticated Mexican rejection or establish actual nonreceipt. No verbatim Mexican conversation transcript, translation process, independently documented intention or final decision is inferred.

**Document 59:** The heading, March 16 Washington dateline, file 763.72119/468 and Robert Lansing signature support the stated attribution. The surrounding body requests transmission of a US reply to the Mexican initiative, restates that initiative and explains the US position. The two selections correctly concern the United States' inability to join the peace invitation at that time and its stated opposition to the proposed trade suspension. The packet neither assigns that refusal to Mexico nor treats it as Mexico's answer to Germany, and does not adjudicate Lansing's invocation of international law. Its quotation/repetition of the earlier note is not an independent Mexican witness.

**Publication and locators:** The captured volume metadata names Joseph V. Fuller as editor, Tyler Dennett as general editor, the United States Government Printing Office/Washington and publication year 1931. That year is correctly separated from 1917 policy/document dates. The captured bodies visibly embed page markers 45/46, 239 and 68 at the relevant transitions. The initial page numbers 44 and 238 are retained author transcription locators, not independently stamped initial-page markers in these HTML bodies or verified print pixels. The exact document ID and passage descriptions remain independently usable locators. No index body was read for this review; the final packet correctly uses document 300's own dateline and makes no index-conflict comparison.

## Activities and reuse scope

All five activities are concrete source-reading preparation rather than accepted teaching outcomes. Their expected/rejected answers preserve: the transmission chain and distinct dates; proposal versus execution; speech report versus inference; direction of the US reply; and dependence among documents about the same initiative. The transmission exercise needs the surrounding heading/signature and volume metadata in addition to its selected excerpt; those have been inspected and are identified in the packet. A future authored lesson should retain that context rather than present the excerpt as self-sufficient proof of every name/date. No confidence score, invented response, universal Mexican position or final authored rubric is supplied.

The captured Office of the Historian FAQ states that information in FRUS is public domain and may be used/copied/distributed without seeking permission from the named US offices. That supports the packet's stated publisher-based basis for selected FRUS historical text and original editorial commentary. Images, seals, facsimiles and other sources' protected expression remain excluded; this is not a blanket determination of all German/Mexican sources or a legal/public release approval. The material remains English edition text, not an independent translation supplied by this reviewer.

## Historical findings and repair recheck

At initial JSON hash `c5a2952ed370f519ff94f1b069c44a4a7390091a2205368630bd645d6ea8fbf8` and narrative hash `b38da5ad4a4974fc8c5d310acc3309682704d5418d66145d50b1fcf6012ee700`, I reported one terminology defect: the retained-requirements string called P01's removal of human-session requirements a “waiver,” although the contract has no waiver mechanism. The author changed it to “P01 first-lesson removal of human-session requirements is not extended.” **Resolved.**

The initial source scope/narrative also referred to a conflicting country-index transcription that these five captures cannot independently substantiate. I disclosed that evidence limit; the author removed the comparison and now directs use of the document dateline without inferring dates from an index. **Evidence limit addressed in the packet's wording.** In-memory reversal of only the two changed JSON strings reproduced the exact initial JSON hash above, verifying that the eight selections, source receipts and activities did not otherwise change. The narrative's revised date paragraph was read directly and stays within the captured evidence.

## Remaining limits and gates

This preparation advances a contemporary Mexican governmental-policy witness through an English official documentary edition. It does not resolve original Spanish fidelity, independently documented German-alliance receipt/reaction, all perspectives or causation of US war entry. Qualified history/source review of a final lesson, any applicable language review, final rendered/access/learner evidence and actual distribution scope remain distinct open requirements. P07/P08 draft capacity and zero new authored/accepted lessons/runtime IDs/release decisions remain explicit.

No stopped Carranza April 15 report, FRUS `pg_234`/`pg_235`, inherited blocked source or alternate recovery was accessed. The three successful document captures are distinct works, not a recovery of those stops. No engineering code or separately rejected review operation was inspected or retried. Only this report was written; no canonical, pilot, runtime, Wave or other worktree file was modified.
