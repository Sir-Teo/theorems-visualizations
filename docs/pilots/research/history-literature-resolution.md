# History and literature source and reuse decisions

**October 22, 2026 · scoped decisions for two local text prototypes.**

The authoring gaps are resolved for the selected prototype assets. History uses short, attributed transcript phrases and original explanation. Literature uses two identified historical English renditions and a specifically labeled Japanese display transcription. No scan, modern translation, photograph, recording or publisher's page layout is bundled.

These decisions allow the requested drafting to proceed. Independent content/language review and a release-specific rights check remain acceptance/publication gates. There is no claim of permission for all media, all editions or all jurisdictions.

## History: selected corpus and chronology

| Decision | Evidence and resulting scope |
| --- | --- |
| Diplomatic source | [National Archives decoded transcript](https://www.archives.gov/milestone-documents/zimmermann-telegram), opening paragraph; RG 59, 862.20212/82A and /69. Two short phrases totaling 15 words are used, with original contextual paraphrase |
| Public argument | [Wilson's April 2, 1917 address](https://www.archives.gov/milestone-documents/address-to-congress-declaration-of-war-against-germany), RG 46, paragraph beginning “But they have played their part.” The selected clause is read together with its immediately following reference to the intercepted note |
| Dates | “January 1917” uses month precision; “April 2, 1917” uses day precision. No invented transmission timestamp or complete intelligence chain |
| Dependence | The speech refers to the message. It is evidence of Wilson's framing, not a second independent confirmation of the message |
| Missing evidence | Neither selected text supplies Mexican acceptance or isolates one cause of the US war decision. Feedback also avoids inferring rejection merely from missing acceptance evidence |
| Reuse | Short critical quotations and original paraphrase; official presidential speech is government text. No blanket public-domain claim for the foreign-origin decoded translation or every hosted record |
| Images | Excluded from the prototype, so facsimile clearance and pixel inspection are not hidden prerequisites |

The [National Archives copyright FAQ](https://www.archives.gov/faqs#copyright) (receipt `nara-reuse`) distinguishes government records from potentially protected donated/other material. It does not clear every image. Broader use of the full telegram translation or a scan needs its own item-level decision.

The archive's explanatory page also makes a broad statement about an April 6 declaration against Germany “and its allies.” The pilot does not adopt that summary. Its limited chronology and argument task are anchored to the selected records.

**Closed for drafting:** passage selection, source IDs and exact locators, date precision, source-dependence boundary, and text-only reuse scope. **Remaining:** historian/provenance review of the authored interpretation, independent accessibility review and formative reader observation.

## Literature: editions, text fidelity and display witness

| Asset | Selected witness and decision |
| --- | --- |
| Aston rendition | [Academy of American Poets page](https://poets.org/poem/ancient-pond/embed), credited to *A History of Japanese Literature* (William Heinemann, 1899). Page explicitly marks the poem public domain. Preserve the three lines and punctuation |
| Hearn rendition | [*Exotics and Retrospectives*](https://www.gutenberg.org/files/42735/42735-h/42735-h.htm), “Frogs,” printed p. 164, digitized 1914 edition, copyright 1898. Preserve “jumping,” not a secondary “jumped” quotation. Preserve the rendition without authored line breaks, omitting only its enclosing quotation marks/parentheses; natural viewport wrapping is not a source line break |
| Hearn reuse | [Gutenberg catalog, ebook 42735](https://www.gutenberg.org/ebooks/42735), receipt `gutenberg42735`, explicitly declares public domain in the USA. The selected historical text is used; the wrapper, illustrations and surrounding essay are not copied |
| Japanese display | [Koto City's October 2, 2026 release for the Bashō Memorial Museum exhibition](https://www.city.koto.lg.jp/kuse/koho/houdou/r08/r0810/r081002furuike.html), page 40001, first paragraph; receipt `koto-basho`. Preserve `古池や蛙飛こむ水のおと` exactly |
| Japanese boundary | This is a named modern institutional transcription of a public-domain poem, not an inspected 1686 manuscript or a newly established critical edition. No modern municipal prose or image is reused |
| Original-language analysis | The initial activity compares English wording. It makes no grammatical claim deciding the original's number, no English-syllable/Japanese-unit equivalence, and no unreviewed pronunciation recording |

The [US Copyright Office's overview](https://www.copyright.gov/what-is-copyright/) (`copyright-basics`) distinguishes protected expression from ideas and explains public-domain use. It informs the bounded US prototype decision, not a universal legal conclusion about every territory. The published old renditions and underlying Bashō poem are distinguished from contemporary website assets.

Choosing the Japanese display witness resolves the previously unspecified text for this task. It deliberately does **not** resolve every question of textual history. The earlier NDL record remains a bibliographic lead; it is no longer the authority for the displayed spelling. A Japanese literature specialist still needs to review interpretation, labels and any later original-language analysis.

**Closed for drafting:** named English editions, exact wording/format, Japanese display witness, translator/creator separation, selected-text rights scope and exclusion of unlicensed modern media. **Remaining:** independent literary/language review, accessibility review, learner observation and a public-release distribution check.

## Receipts and reproducibility

The five displayed source records and six selected passages are embedded in [history.json](../../../explorations/history.json) and [literature.json](../../../explorations/literature.json). Each passage records SHA-256 over its exact UTF-8 display text. These are **selected-text hashes**, not claims that a complete remote page was archived or read in full. A wording change fails validation until the source decision and digest are deliberately reviewed.

Source access and rights receipts remain in [sources.json](../../coverage/sources.json). Earlier denied/CAPTCHA sources were not reopened. The new Iga museum candidate timed out and was not used for the displayed witness; the independently authored Koto release was successfully read. A timeout is not reported as verification.

No reviewer was recruited or message sent by this task. The user authorized starting both pilots; that authorization does not fabricate expert acceptance. The two draft slots are now occupied.

## Subsequent 0.1.1 review

The English source selections were rechecked, and all six selected-text hashes remain unchanged. Editorial descriptions now distinguish the selected web displays from original print layouts and quotations from author context. Koto timed out during the later review; retain its prior body-read receipt without treating that as a fresh successful check. No alternate recovery was attempted. See the [review receipt](../../verification/universal-pilots-review.md).
