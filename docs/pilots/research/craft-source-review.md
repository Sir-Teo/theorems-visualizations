# P07 independent AI source and design review

Date: 2026-10-22.
Reviewer: `atlas-ai-history-review`, independent AI source/context reviewer. I do not claim textile-practitioner, conservator or physical-instruction testing credentials.

Material reviewed: `docs/pilots/07-craft.md` in `/Users/teodev/.codex/worktrees/universal-pilots-integration/theorems-visualizations`, the `textile-techniques` registry reference and the proposed six-by-six front/back/strip-repair design supplied by the integration owner. No authored P07 JSON/artifact was supplied for exact-version acceptance; this is a source/design review, not a pilot acceptance receipt.

I retrieved the permitted ARTEX source body once through web retrieval. No browser was launched, no repository files were edited, no stopped source was reopened, and no other chat/person or subagent was contacted.

## Source and reuse boundary

[ARTEX, Hellenic Centre for Research and Conservation of Archaeological Textiles, “Production techniques”](https://artextiles.org/en/node/185), inspected 2026-10-22, plain-weave section (retrieved body lines 129–132). The text explains a one-over/one-under weft/warp interlacing and notes that material and thread properties affect appearance. It also distinguishes different relative warp/weft densities. This supports the generic structure and the brief's warning that a grid alone cannot establish material properties. It does not demonstrate a paper procedure, prove a particular repair, or establish a unique cultural origin. Its images were not inspected for rights or cleared for copying. The page shows a copyright notice; availability is not an image licence.

Use original prose, original diagrams and later genuinely created sample photographs with explicit contributor/asset terms. Do not copy institutional images or modern explanatory prose into the pilot without a separate decision. An original symbolic diagram can illustrate the specified digital convention; it must not be presented as a photograph or evidence that someone made the object. Greek archaeological context is the source's context, not a reason to label this generic paper construction as representative of all Greek textile practice.

**Source/context conclusion:** suitable basis for a bounded conceptual structure prototype, with those limitations. **Rights conclusion:** reference and original explanation/diagram design are supportable; source images and future photographs remain separate assets to clear. No blanket legal or public-release clearance is supplied.

## Terminology and coordinate convention

The proposed model is coherent if its reader-facing contract states these points explicitly:

- Warp strips are the six columns and weft strips are the six rows in the chosen front diagram. These are chosen diagram axes, not a universal statement that warp must be vertical in any real object or photograph.
- Canonical strip IDs remain attached to the same physical strips in every view. Give the warp and weft distinct prefixes or clearly named labels; “row 2, column 3” should always resolve to one canonical crossing.
- Let `frontWeftOnTop(r,c)` identify whether the weft is visible above the warp when viewed from the declared front. Choose and disclose a start convention, such as true when `(r+c)` is even, using one-based IDs. Every adjacent crossing in both row and column then alternates.
- Do not silently equate the equal-size checkerboard with the appearance of every textile called plain weave. Strip width, gaps, thickness, packing and tension are outside this ideal binary model.
- Separate cut paper weft strips model crossings without modelling continuous yarn, selvedges, loom mechanics or finishing. The activity should identify those omissions.

These conventions should be shown in a short legend and in the linear table alternative, not inferred only from colored squares.

## Back-view check

A turn about a vertical axis keeps row order but reverses column display. For six columns, display column `d` maps to canonical column `7-d`. The back-visible weft at that crossing is the complement of `frontWeftOnTop(r,7-d)`. This is an inversion of which strip is exposed to the viewer, not a mutation of the underlying physical crossing or canonical data.

For an even six-column grid, reversing the checkerboard and complementing it can produce the **same visible checkerboard arrangement**. Therefore a similar-looking board is not evidence the flip failed. Preserve the reversed canonical column labels and an orientation marker so the reader can trace the same crossing. The selected crossing should continue to identify the same physical canonical pair as its screen position moves. Labels should say “weft visible on this side,” or explicitly distinguish front-relative data from back-relative display.

Do not use a 180-degree in-plane rotation as an illustration of the back; it shows the front rotated. A later real demonstration must turn the specimen over about the declared vertical axis, show the orientation marker, and retain canonical labels.

## Error and repair check

Specify the incorrect crossing sequence rather than using “a repeated crossing” ambiguously. In an alternating row, changing an expected under-crossing to over can create **three consecutive over-crossings** in an interior position. Changing an expected over to under creates the corresponding under-run. Edge cases differ. The diagram/feedback should describe the actual selected row and affected crossing IDs rather than promise exactly two repeats.

Removing and reweaving the entire selected weft strip is a plausible discrete paper operation when both ends are accessible and crossings are not glued or permanently fixed. The digital action should show that operation as a row sequence, not teleport an isolated crossing while implying that no unthreading happened. Keep every other canonical crossing unchanged as the intended model result, while disclosing that real neighboring strips can shift and need stabilization. The physical procedure must specify temporary edge support, accessible ends and how the remaining strips are held. Avoid promising that a middle strip can always be pulled out neatly from a sealed or tightly packed specimen.

**Design verdict:** no conceptual blocker to authoring a bounded digital model with these explicit conventions. This is not proof of physical feasibility, hand skill or practitioner validation. The current brief's missing-photo and second-person reproduction gates should remain genuinely open.

## Physical evidence protocol to carry into authoring

1. **Freeze a reproducible specimen plan.** Record paper type, strip count/width/length, gaps, colors/patterns, edge support and whether any adhesive is used. Begin with supplied pre-cut strips. Identify which support is temporary and must be released for extraction. Record canonical warp/weft labels and an unambiguous front/top marker. A practitioner should first check these instructions and the proposed repair sequence.
2. **Build a real baseline specimen.** Photograph the actual labelled materials, initial warp layout, first two opposite-phase weft insertions and completed front. Include enough edge and orientation information to identify the same strips. Capture a real back view by the declared flip. Record the crossing matrix from each view and compare it to the canonical table. Use close descriptions/captions for what each image actually shows.
3. **Demonstrate the actual error and repair.** Make the stated incorrect weft sequence in a real sample. Record the affected crossing IDs and whether the error creates an over-run or under-run. Photograph the error, extraction of the whole selected strip, the supported remaining structure, incremental reweaving and completed front/back. Record any movement, buckling or extra assistance. An unverified digital animation is not evidence for these steps.
4. **Check the assets.** Keep the original photograph files, creator/date, specimen/version, licence/permission and captions. Photos must be of the actual task specimen; generated imagery may be explicitly illustrative but cannot satisfy this demonstration requirement. Compare captions and diagrams against the physical sequence before release.
5. **Have a second person reproduce it.** With consent, assign a nonidentifying participant code and supply only the frozen instructions/materials. Record completed steps, their explanation of front/back identity and the model's limits, errors, time/order if useful, requests for help and any help given. The original demonstrator should not silently correct their specimen. A practitioner assesses structural fidelity and physical repair; do not invent this role or receipt.
6. **Offer and evaluate access routes.** Supply a numbered linear sequence and crossing table, large high-contrast strips and clear word/pattern distinctions; permit partner assistance and a digital-only route for conceptual structure. Record which route was used and any assistance. Do not infer equivalent tactile/motor competence from the digital route or from successful clicking.
7. **Bind the evidence and iterate.** Store exact instruction/model/asset versions with observations and resulting repairs. Recheck after meaningful changes. Report separately structural model correctness, physical completion, handling observations and unobserved properties such as textile drape/tension. Any claim of learned hand skill needs the relevant actual observation.

Do not recruit, message or photograph a person merely because this review proposes a protocol. This report specifies the missing evidence to obtain under an authorized real session; it does not claim those sessions occurred.

## Open outcomes

- Original physical sample, front/back and repair photographs: unavailable, not verified.
- Practitioner completion/check: not performed by this AI.
- Second-person reproduction: unavailable, not verified.
- Full authored digital model, keyboard/table parity and runtime tests: not supplied for this review.
- Accessibility/task observation and physical handling evidence: not observed.

The proposed digital structural slice can proceed with honest limitations; it must not be described as a demonstrated physical lesson or a fully accepted P07 craft pilot while those physical claims remain unproven.
