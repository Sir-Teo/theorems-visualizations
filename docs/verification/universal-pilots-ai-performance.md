# P08 implemented draft: independent AI review

Date: 2026-10-22. Reviewer: separate Codex `literature_review` AI process, acting as source/instructional-design reviewer. No performer, professional music-educator, legal or accessibility-observer qualification is claimed. No repository edits, browser, new source requests, other-chat messages or nested agents were used.

## Exact candidate and method

Record: `x-performance-0001`, revision `0.1.0`, draft/local-preview.
Content digest: `862e2e8b68c83197998279111f689bcfe81dde990a06cbbf256a9bbb408a785f`.
Artifact digest: `b24e36b9e5defdf74dda27e5fd080a75f91a56fb2b51cc662485e12f9af04dc0`.

Read canonical `explorations/performance.json`, `performance-model.mjs`, `studio-views.mjs`, `studio-ui.mjs`, the original-assets proposal and supplied review HTML. Independently recomputed both digests with Node 22.23.3 `node:crypto`, a separate canonical serializer, the builder's current bound-file set and current related collection titles. Values match `/tmp/atlas-studio-digests.json`. Canonical rendering exactly reproduces `/tmp/atlas-studio-review-pages/x-performance-0001.html`; the selected paraphrase's hash also matches. Evaluated all six version/tempo signals and their WAV encodings without playback. This verifies numeric/model properties, not audible perceptibility or native browser behavior.

The primary teaching-source body was independently inspected in the prior source review: [Carnegie Hall expressive-qualities resource](https://www.carnegiehall.org/Education/Programs/Link-Up/New-York-City/Explore-Expressive-Qualities-in-Music-and-Movement). It supports comparing musical choices and explaining responses. No new source claim or third-party excerpt/media is introduced by this implementation; no fresh retrieval was needed. See `/tmp/atlas-p08-source-review.md` for that body-read scope.

## Findings

**P2 — Include provenance and pending terms with the generated WAV export.** In `explorations/studio-ui.mjs`, the `phrase-download` handler exports only the WAV and a variant/BPM/region filename. `encodeWav` writes audio-format/data chunks without authoring, event, licence-status or version metadata. The exported file therefore cannot carry the exact event JSON and synthesis-code version requested by `docs/pilots/research/studio-original-assets.md`, or the visibly pending rights terms. Add an accompanying provenance export containing pilot ID/revision, content/artifact digests or actual synthesis-code digest, event offsets and gate/synthesis parameters, BPM/region/sample format, Codex-assisted provenance and explicit proposed-not-granted release terms. A deliberate combined export or linked companion JSON is suitable; do not silently grant CC BY in metadata. This is a repair request for the export, not a claim that a licence has been granted or a reason to discard the local draft.

No other actionable conceptual/source defect found in the reviewed candidate. Native transport correctness remains for the separate engineering review and actual browser checks.

## Supported observations

- Eight beats is correctly a metric span with nine events. Zero-based offsets and displayed beat numbering are explicitly distinguished. The original offsets remain stable across variants and tempos.
- At each selected BPM, short/sustained gates are 0.12/0.42 beat; frequency is 440 Hz, waveform sine and peak-gain parameter 0.18. The code's 5 ms attack and 15 ms release are included inside each gate, not appended after it. No event overlaps another. The maximum computed sample magnitude is approximately 0.180000007 (Float32 rounding), well below clipping. Equal perceived loudness, energy or timbre is expressly disclaimed.
- Full spans render 8 s at 60 BPM, 5⅓ s at 90, and 4 s at 120. At 90 BPM, gates are 0.08/0.28 s, agreeing with the no-audio guide. The last sustained tone ends at offset 7.42; silence continues to the span end. The smallest sustained gap is 0.08 s at 60 BPM, approximately 0.053333 s at 90 and 0.04 s at 120. Thus neither version is represented as fully connected/legato.
- Seconds derive from offset × 60/BPM, and gate lengths scale with beat duration. Attack/release remain fixed in seconds, as disclosed. Source event IDs, beat/time table and gap-to-next/span-end column allow a checkable structural observation at each tempo.
- Formula-generated mono PCM and locally encoded WAV avoid third-party samples. This is explicitly a generated sine-tone rhythm, not a human percussion recording. The source is instructional context, not empirical proof that the authored stimulus works.
- The claim about controlled parameters explicitly attributes itself to the event/synthesis specification. Its displayed-source reference is pedagogical rather than a purported external measurement of this audio. The proposed expressive interpretations remain open and unvalidated by listeners.
- The static no-audio guide includes both complete 90 BPM event tables, conversion guidance, span/tail explanation, a located evidence task and multiple possible interpretations. The transfer rubric distinguishes generated parameters, human performance and listener evidence. It does not promise equivalence to hearing or score agreement with a mood label.
- The asset panel and main limitations identify the CC BY 4.0 terms as a proposal requiring approval. The checkout has no stated repository-wide licence. No human composer, performer release, exclusive copyright or external sample permission is fabricated. The Carnegie paraphrase and excluded-asset boundary remain appropriate for local drafting.

## Scoped decisions

**Conceptual/source content: passed within the inspected model and instructional limits.** This is not a performer assessment or evidence of actual learning. Numeric timing/formula checks support the structural assertions; listening observations remain absent.

**External-source/prototype reuse: passed within reference and original paraphrase only.** No source score, repertoire, recording, worksheet or media licence is inferred. **Original-asset release rights: pending**; proposed terms are not a grant. The export provenance defect above needs repair before treating export provenance as complete. Do not issue an unrestricted whole-rights acceptance from this report.

**Performer/educator perceptibility and pedagogical-meaning review: not performed.** **Learner, screen-reader, reduced-motion, keyboard and actual native playback checks: not performed.** Keep their actual status explicit. The independent source/design AI role cannot close these observation gaps. Full acceptance remains blocked by the declared outstanding reviews and release/provenance scope; exact-artifact recheck is required after repairs.


---

# P08 final repair recheck: bounded independent AI review

Date: 2026-10-22. Reviewer: separate Codex `literature_review` AI source/instructional reviewer. No performer, legal, accessibility or learner-observer qualification is asserted. This supplements `/tmp/atlas-p08-artifact-review.md` and preserves its earlier findings as history.

Exact candidate: `x-performance-0001`, revision `0.1.0`, draft/local-preview.
Content digest: `40190c5a0dc101882934a6579af5e9c3eb75a2d38b65d18e728fee03d9e23aaa`.
Artifact digest: `14fcf71efb415de3c2e36c19f56ba413d09628ef5c5fefda0e9018004edb382d`.

Independently recomputed both hashes using Node 22.23.3, a separate canonical serializer and `node:crypto`, current bound files and collection titles. Values match the supplied manifest. Canonical rendering exactly matches the refreshed supplied HTML. Read current source/model, asset proposal, provenance encoder and shared UI. No browser or source retrieval was used.

## Export finding resolved

The prior P2 finding is repaired. `performanceProvenance` supplies identity/revision, the named version-1 formula renderer, exact event timing/gaps, synthesis settings, region frame boundaries, sample format, Codex-assisted provenance, local-draft rights status and proposed-not-granted terms. `encodeWav` embeds that JSON in a NUL-terminated ASCII RIFF LIST/INFO/ICMT comment, escaping Unicode without losing its JSON value. The playback source and download handler both call the same `wav()` function with that provenance. No separate unprovenanced export path was found.

Independently generated full, first-half and second-half sustained/90 BPM WAVs and parsed their RIFF chunks without relying on the encoder for decoding. Embedded JSON round-trips exactly, RIFF size matches file size, and region frame counts match PCM lengths (256000/128000/128000 at 48 kHz). Supplied private-note sentinel, cursor and playback volume do not enter the serialized selection or waveform provenance. Metadata carries `local-draft` and the explicit pending terms; no CC BY grant is invented. The documentation correctly warns that later editors/conversions can remove metadata.

## Current conclusions

No remaining actionable conceptual/source/provenance defect was found in this recheck. The exact event/gate semantics and no-audio evidence task remain as reviewed: nine sine-tone events in eight quarter-note beats; unchanged onset offsets; short/sustained durations, fixed oscillator parameters and explicit perceptual limits; tempo conversion and release-within-gate/span semantics; multiple supported interpretations without a mood answer key. The paraphrased teaching source is not represented as validation of this generated stimulus.

- **Content: passed within model/source/instructional scope.** No performer perceptibility, actual learning or native playback claim is supplied by this AI review.
- **Provenance: passed within authored specification and local generated-export scope.** The repaired exported file retains the actual renderer/formula and event/settings record and pending rights context.
- **Rights: passed only for continued local drafting/review and the source-reference/original-paraphrase boundary.** No third-party repertoire, recording, score, worksheet or sampled instrument is imported. **Public-release terms remain pending**; the licence proposal is not a grant or legal clearance. This is not unrestricted rights acceptance.

Performer/educator observation, actual learner and accessibility observations remain unperformed in this review. Parent-reported native playback/export and engineering test results are not relabeled as my own observations. Full acceptance is not issued. Any later content or bound-code change requires a new artifact binding. No authored file edit, browser, source request, other-chat message or nested agent occurred.
