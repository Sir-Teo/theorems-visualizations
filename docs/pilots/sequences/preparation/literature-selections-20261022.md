# Literature follow-up source selections

Prepared 22 October 2026 against `f76aae4d8f34638276932afbe3d0149e87d164a6`. The [selection dossier](literature-selections-20261022.json) freezes 16 complete paragraphs from three inspected digital witnesses. It advances the source preparation for P02-L02 and P02-L03; it is not an authored lesson, new runtime record or acceptance.

## Decisions

| Follow-up | Preparation now supplied | Still required |
| --- | --- | --- |
| P02-L02, edition comparison | Three 1818 paragraphs and four 1831 paragraphs, exact snapshot and selected-text hashes, explicit normalization and evidence boundaries | Final authored alignment/rubric and artifact review; print fidelity needs print evidence if claimed; draft capacity |
| P02-L03, narrative access | A distinct, explicitly attributed 1918 school-reader witness; nine selected paragraphs; transparent replacement of the earlier proposed witness | Final source/context scope and artifact review, any required human observations, draft capacity; original 2518 provenance remains unresolved |

The previous briefs and their shared source/queue files remain byte-identical historical research records. This dossier records the new selection decision separately. Future P02-L03 preparation should use `tagore-1918-pg33525`, not silently relabel the old `seq-tagore-2518` source. The existing first literature lesson remains unchanged.

## Frankenstein: a bounded edition comparison

The selected [1818 transcription](https://www.gutenberg.org/cache/epub/41445/pg41445-images.html) describes Elizabeth as Victor's paternal aunt's child. The selected [1831 transcription](https://www.gutenberg.org/cache/epub/42324/pg42324-images.html) gives a different parentage and foster-care account, while retaining familiar use of “cousin.” The frozen groups include the surrounding care arrangements and Victor's evaluative language so the comparison does not rely on an isolated kinship word.

Paragraph notes distinguish narrated events, reported speech and interpretation. In particular, the 1831 account does not settle Elizabeth's father's fate; the 1818 narrator also reports his mother's words rather than supplying an independent record. Both witnesses allow examination of Victor's evaluative language. Neither selected group proves Shelley's motive for revision, a legal adoption status, or all changes between the editions. Narratorial judgments of appearance, class and possession are objects of reading, not atlas judgments.

The 1818 transcription identifies a photo-reprint as its basis and reports an ebook update on 6 October 2026. The 1831 ebook reports an update on 23 October 2024. Their moving URLs are supplemented here by exact downloaded HTML hashes and normalized paragraph hashes. No first-edition page image or manuscript is claimed as inspected. Catalogs: [41445](https://www.gutenberg.org/ebooks/41445), [42324](https://www.gutenberg.org/ebooks/42324).

## Cabuliwallah: change the witness explicitly

The [selected 33525 witness](https://www.gutenberg.org/cache/epub/33525/pg33525-images.html) represents *Stories from Tagore*, New York, Macmillan, October 1918. Its Notes at transcribed p.223 explicitly attribute this translation to Sister Nivedita. Its preface describes a school reader and slight revision of stories from earlier English volumes. Accordingly, the attribution does not establish that every word is unchanged from her earlier translation or identify who made each revision. The catalog records the ebook update as 28 January 2020. [Catalog](https://www.gutenberg.org/ebooks/33525).

The previous [2518 witness](https://www.gutenberg.org/files/2518/2518-h/2518-h.htm) reads “band” in the hand-impression paragraph. The selected 1918 witness reads “hand.” This is a recorded change of edition, not an emendation of 2518 or a determination of how its anomaly arose. No text is silently borrowed from another translation. The 1912 *Modern Review* attribution surfaced as a discovery lead, but its facsimile was not inspected or used to certify the selected wording.

The nine paragraphs preserve mixed narrative access: a disclaimer followed by an attributed belief; imagined travel; seeing police alongside a secondhand account of an earlier quarrel; quoted speech; an object and its narrated emotional history; attributed thought; and the father's thought of a reunion. A whole paragraph can contain several kinds of access. The father does not narrate witnessing the stabbing or a later reunion in Afghanistan. This packet makes no Bengali diction, translation-equivalence or factual generalization about a community.

## Reproducing the exact selection

The source snapshots were successfully downloaded from the same inspected public URLs and are retained locally at `/tmp/atlas-literature-selections-20261022/`. Their full bytes are not bundled in this package. The dossier records the exact filenames, lengths and SHA-256 hashes; its 16 selected quotations remain available independently of that temporary directory.

```sh
python3 docs/pilots/sequences/preparation/verify-literature-selections.py --source-dir /tmp/atlas-literature-selections-20261022
```

The offline checker refuses changed source bytes, invalid paragraph locators and selected-text mismatches. It decodes HTML entities, removes page-number spans, retains visible text from study links, collapses whitespace and preserves all other characters. It does not reproduce italics, link styling or page layout. Locators count all explicit HTML paragraphs in the pinned snapshot, including empty/wrapper paragraphs. Transcribed page labels are not observed print pages. The checker never retrieves a source or grants a review.

Only historical selected text, source references and original editorial notes are included. All three catalogs state public domain in the USA; actual distribution and attribution/trademark conditions remain a release decision. Images, automatic summaries, modern site apparatus and study glossaries are excluded. No professional credentials, Bengali expertise, learner sessions or screen-reader observations are inferred. The first-lesson human-check removal is not extended to these follow-ups.

See the [independent source/editorial review](review-literature-selections-20261022.md), [verification checkpoint](../../../verification/universal-literature-selections.md) and [additive integration procedure](../../../integration/literature-selections.md). P07/P08 retain both unaccepted draft slots.
