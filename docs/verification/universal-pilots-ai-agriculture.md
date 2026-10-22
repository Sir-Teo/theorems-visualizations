# P05 actual artifact review · independent AI · 2026-10-22

Reviewer identity: `ai-p05-data-source-reviewer`. Role: independent AI source/data reviewer, with bounded source-column, reproducibility, content and prototype-rights checks. No soil-scientist qualification, human screen-reader/learner observation, lab calibration audit or publication approval is claimed. No browser launched, no repository writes, no other chats, no nested reviewers.

## Scope and decision

Reviewed `explorations/agriculture.json`, `method-models.mjs`, `method-views.mjs`, `method-ui.mjs`, `docs/pilots/research/soil-subset.py`, and the actual static rendered page `/tmp/atlas-next-review-pages/x-agriculture-0001.html` against the frozen original CSVs and API metadata used in the earlier independent review `/tmp/atlas-p05-data-review.md`.

**Scoped content: passed for the present local prototype. Scoped provenance: passed. Scoped prototype rights: passed.** No blocking finding remains in the data/source scope. These decisions apply only to the exact digests below, original numerical observations plus original explanations, and the declared local-preview scope. Independent soil-science interpretation and representative-sampling questions remain explicitly open for publication. This receipt does not approve a public release or satisfy an unrelated professional/human review requirement.

## Exact independently recomputed identity

- Pilot `P05`, exploration `x-agriculture-0001`, revision `0.1.0`, currently draft/local-preview.
- Content digest: `145a8e43d67936ce7b78fd1069ffd461d3952e9eda39e0307ed895e76c640513`.
- Artifact digest: `85cdece4e9c9ad777527087877902e338228a7c9432bb38d2fbc79ac5df7e99e`.
- Rendered HTML SHA-256: `57dfeaab0364db98c8b6fea2a05c7b3d122e507f6efea3febdd47233023b22de`.
- Raw source retention CSV SHA-256: `41308fba78d50d96152f40b85af43f45a9aed4d53e23568db483889c8ed744b1`.

Recomputed the content/artifact digest algorithm independently with Node crypto and a separately written recursive canonical serializer (not the exported digest functions). The content excludes lifecycle/review fields as defined by the contract. Artifact binds the current nine code-file hashes and exact related collection titles. Complete hash evidence: `/tmp/atlas-p05-artifact-hashes.json`. Digests agree with `/tmp/atlas-next-pair-digests.json`. Rendering current authored data and collection labels reproduces the supplied HTML byte-for-byte.

## Measurement fidelity

Ran the repository reproduction script against the pinned original file. Independently extracted every plot1 source row using Python csv, enumerated 1-based physical CSV rows including the header, retained eight exact source strings, and compared the entire resulting list with the authored dataset. **All278 records, all projected fields, source order and exact decimal strings match.**

Independently parsed the supplied HTML tables with Python HTMLParser and compared every source row, magnitude string, water string and instrument label against the original CSV projection. **All278 rendered table rows match exactly.** Evidence `/tmp/atlas-p05-artifact-rowchecks.json`.

- US-DFC_1_000, depth0cm:102 observations (82HyProp,20WP4C).
- US-DFC_1_010, depth10cm:93 observations (80HyProp,13WP4C).
- US-DFC_1_050, depth50cm:83 observations (75HyProp,8WP4C).
- All278 sourceRow identities remain distinct. No excluded density or conductivity field is present in the authored observations or used by calculations.
- Same-magnitude observations survive: source rows902/904 retain magnitude1.0471285 with water19.12/12.21; rows916/922 retain magnitude9.332543 with water5.09/5.31. Both are visible in tables; point selection keys on sourceRow rather than suction.
- Instrument mapping is correct and independently supported by metadata:1=WP4C,2=HyProp. Instrument is not called a quality flag.

## Plots and model

Read all chart/model/interaction code. Direct `scatter` calls yield102,93,83 primary observation groups for the three samples, matching their full retained rows. All source magnitudes fit the fixed0.0001–100MPa frame; reported percentages fit0–100. Horizontal log10 positions and linear percent positions are mathematically consistent with labelled axes; equal log distances represent ratios. No connecting or fitted path is generated. Comparison marks use squares and primary marks circles, with raw values retained in SVG titles and complete static tables. Source-row selection ring does not replace an observation.

Measured values use the qualified label **reported water content (%)**, and the context explains that available metadata does not explicitly establish volume/volume. Positive `MPa_Abs` is consistently labelled water-potential magnitude, with explicit negative-water-potential source convention. The artifact applies both substantive cautions from the earlier review.

Synthetic calculation is physically and editorially separate. The model takes only assumed upper/lower volumetric fractions and layer depth; it never reads measured rows. Independently checked (0.30−0.15)×0.40×1000=60mm and code returns60. Upper1/lower0/depth2 returns2000mm; upper below lower and zero depth return stated errors. Static explanation and dynamic result both identify these as invented assumptions, not measured field capacity, wilting point or irrigation advice. Sampling-density, causal-depth, site-representation and calibration limitations are visible.

## Provenance and prototype rights

The page links the **version DOI** https://doi.org/10.5281/zenodo.18273606 and CC BY4.0 https://creativecommons.org/licenses/by/4.0/, attributes all nine creators (full names in source entry; disambiguated surnames in activity attribution), preserves the dataset title, and distinguishes sample date2025-05-29, metadata publication2026-01-16 and API created/modified2026-03-03. It identifies filename and source SHA-256 and discloses all plot1 selection, eight-column projection and log10 coordinate transform. No imported figures or FAO assets are used. Original numerical values are unchanged.

The reproduction-script link resolves from `/labs/atlas/x-agriculture-0001/` to `/docs/pilots/research/soil-subset.py`; its source checks both the original file's pinned SHA and every retained record/value/order. The script is a verification aid, not a claim of fresh remote retrieval. Attribution follows the cached authoritative record's CC BY4 declaration; original ownership was not independently investigated. The page honestly states the later inaccessible API recheck and uses frozen evidence.

## Limits

Static/render-code checks are not actual screen-reader or learner observations. No browser or visual usability session was performed by this reviewer. Data plausibility does not prove instrumentation, laboratory protocol, calibration, uncertainty or representativeness. No density unit correction, conductivity comparison, curve interpolation/fitting or field recommendation is approved. Existing P01/P02 artifact receipts were outside this P05 review; their expected staleness is not a P05 content failure.

## Final exact-artifact recheck · 2026-10-22

Re-read the changed `reviewLimitations` wording: it now accurately identifies bounded local review and explicitly states that no professional specialist, screen-reader or learner session has been performed. This does not invent those observations. Re-read the two new validator checks: omittedColumns must be a text array; projection must contain distinct textual column names. These prevent invalid metadata from reaching `.join` in rendering. Authored dataset passes the validator with zero errors.

Independently recomputed hashes again using Node crypto and a separate canonical serializer, and compared current render output to the refreshed supplied HTML byte-for-byte. Current identifiers, superseding the earlier exact-artifact values:

- P05 `x-agriculture-0001` revision `0.1.0`.
- **Content digest `d0f0f916bbed98c6abd120f748e1a4edd05e9496bc39c6dc3b56600eccdbac6d`.**
- **Artifact digest `3d78688e111a8e8a24ec2d85bf8bc610f5c13b05f8f6ffeb9ebd00dd8765baed`.**
- HTML SHA-256 `c6ee1dfbdf39584cab6e87897bf061d0b756b9dbea22234e07a224c55dd8f5eb`.
- Changed method-models SHA-256 `816099508dc8a98789adc0b8efc5d823f1643dadef2e8b928755e329322c57fd`.
- Full recomputation evidence `/tmp/atlas-p05-final-recheck-hashes.json`.

Re-ran source projection verification: all278 rows remain exact, with102/93/83 observations per selected sample and the same pinned source SHA-256. Other source, model, display and table code hashes are unchanged from the complete prior review. Scoped AI **content/provenance/prototype-rights decisions remain PASS for these current exact digests**. No new finding. All previously stated limits remain, including no publication or professional/human-session approval. No repository edits or browser work performed.


## Readable chart final recheck · 2026-10-22

Independently read the final CSS and generated markup without browser use. The chart wrapper is now a focusable named region with horizontal overflow, and SVG minimum width700px preserves its labelled coordinate frame instead of proportionally shrinking labels on a narrow container. Raw point readout and complete tables remain available. Static caption explicitly describes horizontal scrolling. No measured values, coordinate formulas, model logic or source claims changed.

Current independently recomputed identities:

- Content digest (unchanged): `d0f0f916bbed98c6abd120f748e1a4edd05e9496bc39c6dc3b56600eccdbac6d`.
- Artifact digest: `e4a5eeec558a552bed8bb38c81825de88dfc3e882f5c974e15cac10e21452e6b`.
- Refreshed HTML SHA-256: `0ae8d6c021d222963cae4fc2e4a12988570ffa852b7bc218954464bd9c402c89`.
- Current render reproduces refreshed HTML exactly. Full independent hashes: `/tmp/atlas-p05-readable-chart-hashes.json`.

Scoped content, provenance and prototype-rights decisions remain **PASS** for these exact identities, within all prior limits. The dynamic chart caption also preserves the visible horizontal-scroll instruction, as confirmed in the correction below. No outstanding finding remains. No human accessibility, actual320px browser observation, specialist or publication approval is claimed by this code/markup recheck. No source retrieval or repository edits performed.


### Correction: caption finding withdrawn

The prior low-severity caption recommendation was incorrect and is withdrawn. Independently reread `explorations/method-ui.mjs` line26: its dynamic `plot-legend` text already ends “On a narrow screen, scroll the chart horizontally.” The current file SHA-256 is `1b91c76229f4628cd8262618f75e69723d3eec59d7cf8bae10abca5dc098f84a`, exactly matching the independently recorded file hash for artifact `e4a5eeec558a552bed8bb38c81825de88dfc3e882f5c974e15cac10e21452e6b`. Thus the issue was a reviewer reading error, not a subsequent fix or code change. Static and dynamic captions both preserve the instruction. All scoped PASS decisions remain unchanged, with no outstanding finding.


---

# P05 shared-artifact regression recheck · 2026-10-22

Reviewer identity: `ai-p05-data-source-reviewer`; independent AI data/source reviewer. Read-only repository inspection and local pure-code execution; no browser, source retrieval, authored-file edits, other chats or nested reviewers. No soil-scientist qualification or human/professional observation is claimed.

## Exact current artifact and decisions

For `x-agriculture-0001` / P05 revision0.1.0:

- Content digest **`d0f0f916bbed98c6abd120f748e1a4edd05e9496bc39c6dc3b56600eccdbac6d`**.
- Artifact digest **`34a8ee3489077d0f5d3f31e698769cef43893855ecd03aee8bd6c4450b3f542f`**.
- Candidate HTML SHA-256 `b9f9d5befb48e091e1947a30a7c1fe932d408a4927bb328c4d8deb2f51fa124b`.
- Candidate path `/tmp/atlas-studio-review-pages/x-agriculture-0001.html` reproduces byte-for-byte from current record and collection titles.
- **Bounded AI content: PASS. Provenance: PASS. Prototype rights: PASS. No outstanding finding.** These decisions retain the same limited local-prototype scope as the earlier independent full P05 review, not public-release or professional scientific approval.

Independently recomputed content and complete13-file artifact digests with Node crypto and a separate recursive canonical serializer, without exported digest helpers. All current13 code-file hashes and related collection labels are recorded in `/tmp/atlas-studio-agriculture-hashes.json`. They match `/tmp/atlas-studio-digests.json`. P05 content is unchanged from accepted checkpoint04d3ec62; no P05 authored-file diff was present.

## Regression scope and evidence

Inspected diff from04d3ec62 for contract, route state, renderer, styles, shared method model/view/UI and builder, plus the new studio UI/view and model modules relevant to dispatch. The measured-data branch is unchanged. The new model validators and state normalization dispatch only for weave-structure/phrase-comparison. The new rendering fallback occurs after the existing measured-data return. New studio UI dispatch is called before existing method handling, but both functions do nothing for measured-data.

Directly invoked applyStudio/connectStudio for P05 in Node with no DOM globals installed: both return without DOM access, listener setup, audio generation or transport calls. New imports initialize only function/constant definitions or an unset transport variable; they do not start performance audio or physical-practice behavior for P05. New CSS selectors target studio/phrase/event classes, absent from the P05 measured chart/table; existing measured-plot scrolling rules are unchanged. Shared renderer diff is whitespace only. New contract acceptance restrictions apply only to P07/P08 activity types.

Repeated pure behavior checks:

- Current P05 validation returns no errors.
- Default state remains sampleUS-DFC_1_000, point2, no comparison, assumed fractions0.30/0.15 and depth0.40m.
- Synthetic result remains60mm; measured rows are not inputs to this function.
- Independently generated primary scatter groups remain102,93,83 for the three samples, totalling278 observations.
- Reran the pinned source projection check: every retained source row/value/order remains exact, source SHA-256 `41308fba78d50d96152f40b85af43f45a9aed4d53e23568db483889c8ed744b1`.
- Positive water-potential magnitude, qualified reported-water-content percent labels, raw decimal tables, duplicate-magnitude row identities, instrument1=WP4C/2=HyProp, no fitted/connecting curve, named scrollable chart and static/dynamic scrolling instruction remain unchanged.

## Retained source and rights conclusions

The earlier full review independently compared all278 authored records and all278 rendered table rows to the frozen source. The unchanged content and measured rendering logic preserve that evidence. Creators/title/version DOI10.5281/zenodo.18273606, CC BY4.0 declaration, pinned hash, sample/date distinctions and selection/projection/log10-transform attribution remain intact. No new external asset or data source was introduced into P05 by the studio bundle.

Density and conductivity fields/calculations remain excluded. Metadata does not explicitly establish volume/volume for measured percent; the artifact retains qualified wording and makes no conversion of measured values into storage. Repeated measurements do not become independent field samples. The three-depth comparison is descriptive within plot1, not controlled causal inference or site representation. The separate synthetic60mm model remains an invented uniform-layer assumption, not field capacity, wilting point or irrigation advice.

No new live remote access, measurement calibration, laboratory-protocol verification, uncertainty audit, representative sampling, actual screen-reader/learner observation or soil-science approval was performed. This is bounded regression evidence for existing local acceptance only; all publication limitations from the source/artifact review remain.
