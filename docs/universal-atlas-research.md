# Research and rationale for Master Plan Revision 3

**Research date: 2026-10-22.** Supports the [master plan](../MASTER_PLAN.md) and [coverage map](universal-coverage.md).

## Question and method

Could the current atlas support an ambition of all human knowledge, and what should change without losing existing work?

The review compared the current registry, master plan, production/verification handoffs, selected runtime behavior and check tooling with official education/research classifications, library organization, cultural-heritage frameworks, learning research, accessibility guidance, and provenance/media standards.

The result is an original planning synthesis. **Thirty domains, eight pilots, and U0–U5 are design decisions**, not numbers prescribed by the sources. This is a strategic coverage review, not a systematic literature review or a completed syllabus audit for every proposed field.

## What changed because of the evidence

| Evidence | Planning consequence | Limit |
| --- | --- | --- |
| Education, research and library classifications expose different subject families [R1–R3] | Explicitly add law, education, agriculture, business, religion, literature and other underrepresented areas; cross-check several classifications | None defines the single true boundary of human knowledge |
| Living-heritage domains include practiced, oral and embodied knowledge [R4] | Include crafts, performance, oral traditions and situated practice across domains | Digital representations cannot capture all tacit knowledge or imply permission to publish it |
| Specialist vocabularies organize concepts, names and relationships [R5–R7] | Use crosswalks, aliases and versioned identifiers; keep domain coverage revisable | Indexing vocabulary is not a curriculum, factual verification or blanket content licence |
| Archives teach contextual examination of varied source types [R8] | Add source comparison and provenance as a first-class exploration format | Historical inference still needs subject-specific scholarship |
| Textual scholarship distinguishes editions, witnesses and readings [R9] | Annotated texts and translations require explicit edition and interpretation metadata | TEI adoption is optional; this review did not validate a TEI implementation |
| Learning guidance and simulation research emphasize design, explanation and evaluation [R10–R11] | Add worked examples, explanation/transfer tasks and formative learner observation; separate learning from visual acceptance | Evidence about other settings does not establish this atlas's efficacy |
| Accessibility requirements distinguish keyboard access, dragging alternatives and non-text content [R12] | Build reusable accessible interaction and inspect equivalent content in pilots | Passing a few tasks does not establish whole-site WCAG conformance |
| Provenance and media standards separate content, attribution and presentation [R13–R14] | Add lightweight evidence records and interoperable source/object presentation | A full linked-data stack is not required before the first pilot |
| Search guidance discourages fragment-dependent content discovery [R15] | Plan pre-rendered stable URLs with legacy hash compatibility | Static generation is a proposed implementation; search ranking is not guaranteed |
| Current code/ledgers distinguish actual functionality from aspirational goals | Preserve the engine, accepted versions, frozen waves and unfinished redesign; make acceptance dimensions explicit | Dated checkpoints are not live counts or fresh re-execution of the full test suite |

## Sources and how they were used

### R1. UNESCO Institute for Statistics: ISCED-F 2013

[Official ISCED publication hub](https://www.uis.unesco.org/en/methods-and-tools/isced) and [UNESCO-UNEVOC ISCED-F glossary entry](https://connect.unevoc.unesco.org/home/TVETipedia%2BGlossary/lang=e/show=term/term=ISCED%2BFields%2Bof%2BEducation%2Band%2BTraining%2B2013).

Used the broad education/training families to find omissions beyond STEM: education, business/law, agriculture, welfare and services as well as arts/humanities. The publication hub identifies the 2013 fields framework and detailed descriptions. **Decision:** give practical/professional fields visible scope and create a detailed code crosswalk in U1. Education-program classification is not an exhaustive classification of knowledge.

### R2. OECD: Frascati Manual 2015, Table 2.2

[Publication and official download](https://www.oecd.org/en/publications/frascati-manual-2015_9789264239012-en.html); [official PDF](https://www.oecd.org/content/dam/oecd/en/publications/reports/2015/10/frascati-manual-2015_g1g57dcb/9789264239012-en.pdf).

The fields-of-research classification distinguishes natural sciences, engineering/technology, medical/health, agricultural/veterinary, social sciences, and humanities/arts. The table and broad subdivisions supplied a second gap-check. **Decision:** distinguish biology from care, agriculture from ecology, and social/humanistic inquiry from quantitative models. Its purpose is research statistics; ordinary practice and many cultural activities need additional lenses.

### R3. Library of Congress: Classification Outline

[Official classification outline](https://www.loc.gov/catdir/cpso/lcco/lccowp.html).

Used the visible official outline to check subject families such as law, religion, literature, education, history, agriculture and library/information science, alongside technical subjects. **Decision:** publish a crosswalk and explicit gaps rather than extrapolating from the current 13 fields. Its historical institutional structure is useful evidence of organized subject coverage, not a neutral universal ontology.

### R4. UNESCO: Intangible Cultural Heritage Domains

[Official domain description](https://ich.unesco.org/en/intangible-heritage-domains-00052).

The accessible indexed description identifies oral expression, performance, social practices, knowledge concerning nature, and craftsmanship, while acknowledging flexible boundaries. **Decision:** include living, embodied and community knowledge; avoid treating one numerical model as a complete account of a practice. Access was limited: a later page opening returned a CAPTCHA; no bypass or alternate recovery was attempted. No full-page reading is claimed.

### R5. FAO: AGROVOC

[Official AGROVOC site](https://www.fao.org/agrovoc/).

Its structured multilingual concepts, terms and relationships provide a specialist discovery vocabulary for agriculture and connected fields. **Decision:** use as a seed for D10 gap analysis, aliases and external identifiers. Do not copy a whole vocabulary into authored-item counts or treat its presence as verification of agricultural advice.

### R6. U.S. National Library of Medicine: MeSH

[Introduction to MeSH](https://www.nlm.nih.gov/mesh/introduction.html).

The introduction describes vocabulary/concept structures and continuing terminology changes. **Decision:** make health/life-science mappings versioned and retain aliases as terms change. MeSH helps identify topics and literature; it does not verify clinical claims or replace current clinical sources and qualified review.

### R7. Getty: Vocabularies

[Official vocabulary overview](https://www.getty.edu/research-conservation/tools-databases/vocabularies/).

Getty distinguishes terminology for concepts, people, places and cultural objects, with multilingual labels and contextual usage. **Decision:** separate idea IDs from source/object/person/place identifiers and use contextual names and aliases. Candidate applications include art, architecture, archaeology and heritage. Verify applicable data/media terms before reuse.

### R8. U.S. National Archives: Document Analysis

[Official teaching resources](https://www.archives.gov/education/lessons/worksheets).

The resources cover documents, photographs, objects, maps, recordings and other sources, progressing from observation/context to historical evidence and perspective. **Decision:** build a source laboratory with scaffolded questions that can fade as the learner gains experience. This supports the format, not the truth of any future historical account.

### R9. Text Encoding Initiative: P5 Guidelines

[Official P5 guidelines](https://www.tei-c.org/release/doc/tei-p5-doc/en/html/).

The accessible indexed contents identify representation of primary sources and critical apparatus, including textual witnesses and readings. **Decision:** model edition, variant and interpretation separately in literary/textual pilots. The full-page fetch timed out during this review; this is an outline-level design reference, not a claim to have audited the full standard. No required TEI dependency is introduced.

### R10. Institute of Education Sciences / WWC: Organizing Instruction and Study to Improve Student Learning

[Official practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1), released September 2007.

The guide supports spacing, worked examples paired with problem-solving, verbal/graphical representations, retrieval review and deep explanatory questions, with different evidence levels for different recommendations. **Decision:** add explanation, transfer and revisit stages rather than relying on exploration alone. Its guidance does not justify a precise retention-gain claim or an assumption that every proposed prompt is effective.

### R11. University of Colorado Boulder: PhET research

[Official research and design overview](https://phet.colorado.edu/en/research).

PhET describes iterative study of design/use, including learner interviews, and distinguishes conceptual simulation goals from physical equipment skills. **Decision:** treat learner observation as its own acceptance evidence and distinguish simulated practice from real-world competence. Findings for science simulations are not automatically transferable to literature, law, performance or care.

### R12. W3C: WCAG 2.2 guidance

[Keyboard, SC 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), [Dragging Movements, SC 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), and [Non-text Content, SC 1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html).

Keyboard operation and a single-pointer alternative to dragging are distinct requirements, with specified exceptions. Non-text information needs appropriate alternatives. **Decision:** test complete learning tasks with these interaction modes, not just whether a slider has a label. Existing control labels and reduced-motion support remain useful; this is an extension, not a claim that the current site has no accessibility features. The Understanding pages explain the criteria and are not themselves the normative standard.

### R13. W3C: PROV-O

[PROV Ontology, W3C Recommendation](https://www.w3.org/TR/prov-o/), 30 April 2013.

PROV provides interoperable provenance concepts for entities, activities, agents and derivation. **Decision:** record source → transformation/model → explanation → review relationships, initially with simple compatible records. It informs metadata semantics; the atlas need not adopt RDF storage or a graph database to begin.

### R14. IIIF: Presentation API 3.0

[Official specification, version 3.0.0](https://iiif.io/api/presentation/3.0/).

The specification organizes compound objects and their image, text, audio and video resources for presentation and annotation. **Decision:** evaluate IIIF-compatible object/media references for source laboratories and performance exploration. The specification explicitly separates presentation from discovery metadata; it does not solve the atlas's search, rights or epistemic-review requirements.

### R15. Google Search Central: JavaScript SEO basics

[Official guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

The guidance discusses crawlable links, rendering and routing, recommends History API routing rather than using fragments for different content, and discusses pre-rendering. **Decision:** retain static deployment while planning readable pre-rendered pages and compatible legacy links. This is discoverability engineering, not a promise of search traffic.

## Repository evidence and implications

The active expansion worktree was inspected at `04120914`; the older chat checkout and separate redesign ledger were also read. Locations below are repository-relative unless a worktree is specified.

| Evidence inspected | Finding used in the plan |
| --- | --- |
| `content/fields.js` and all `content/*/collection.js` via `loadRegistry()` | 13 fields / 85 collections, zero registry problems. Every collection has a primary home in the coverage map |
| `docs/wave-continuation.md` and `docs/verification/wave6-production.md` | Accepted 36 and newer 66 author-verified ideas have different status; preserved ODE/ALG drafts are another track; exact source restrictions survive |
| `docs/wave-6-plan.json` and `docs/wave-6.md` | Frozen Wave 6 assignments must not absorb newly proposed universal collections |
| Redesign worktree: `docs/verification/wave5-visual-redesign.md` at `2efc5984` | 55/1,101 verified redesigns; scope differs from current expansion |
| `docs/verification/flagship-proof-curation.json` | Flagship curation remains 2/100; control-player audit is a different claim |
| `assets/js/app.js`, prerequisite planner | Computes full ancestor closure, motivating separate curated intuition/applied/formal routes |
| `assets/js/app.js`, item/status rendering | Uncertainty is displayed generically as “number unverified”; status counts written/planned/visualizations rather than the proposed acceptance dimensions |
| `assets/js/viz/core.js` | Existing numeric controls and scene rendering are reusable; semantic scene equivalents and input alternatives require explicit design/inspection |
| `scripts/check.mjs`, changed-file selection | Matches chapter filenames, so dotted shared helpers and runtime effects need dependency-aware affected-page selection |
| Existing master plan | Contains outdated founding-state prose, obsolete fixed-total targets and historical execution instructions alongside newer progress; archive rather than discard that history |

These findings identify platform work; no source code was changed by this planning revision. Historical test counts were read from recorded evidence, not rerun or certified against concurrent drafts.

## Research limits and next research obligations

- The U0 inventory covers broad subject families. It does not establish that every subfield or community is represented. The U1 extension below now supplies a crosswalk at explicitly declared levels; remaining detailed and community-specific inventories still need review.
- U0 did not read full source texts for every proposed lesson. The U1 briefs now have bounded passage/data receipts and rights plans; independent subject review and the named source/asset gates remain necessary before acceptance.
- The UNESCO heritage page and TEI guidelines have the access limits stated above. Classification/source discovery must not be misreported as full-body verification.
- Existing chapter-specific denied/paywalled/CAPTCHA/source-review stops remain binding. This broad research does not reopen any of them.
- The proposed health and legal domains are scope/format recommendations, not clinical or legal guidance. Their actual content needs current, jurisdiction/context-appropriate sources and qualified review.
- Learner testing, community consultation, specialist reviewer recruitment and translation review have not been conducted by this revision. They are roadmap work, with feasibility checked before pilots are frozen.
- Reference federation should start with stable links and metadata. External content is not automatically licensed for mirroring, and a linked source does not become a reviewed atlas lesson.


## Documentation validation

The revision was checked for 30 unique planning domains and a one-to-one primary mapping of all 85 registry collection IDs, with no missing, duplicate or invented collection IDs. New relative document links and Markdown table structure were checked in both destination worktrees. Sections 7.2 and 7.3 remain available to existing production handoffs.

The prior master plans are preserved byte-for-byte as `MASTER_PLAN_V2_ARCHIVE.md`. Their SHA-256 digests are:

- Chat checkout: `7f10b05580676436da6cd8df89cccc4368cda6ee4e3ef95960bf838e8eca6a60`.
- Active expansion checkout: `7f78964c74fccc10b5b209a499cad58e7ed5e797a5a0c7a09f680884d94342e6`.

Frozen Wave 6 inventory/progress, the operational continuation and production ledger, AUTHORING, and field guidance were checked against pre-edit hashes where present. This documentation-only revision does not rerun the application suite or alter product/content files.

## U1 extension: registry and eight pilot research briefs

**2026-10-22, U1 research checkpoint.** The [registry guide](coverage/README.md), source register (38 receipts at this checkpoint) and [eight briefs](pilots/README.md) extend the preceding U0 research. The registry maps every existing collection once and accounts for 217 external entries: 137 mapped, 79 review-needed and one administrative exclusion. These are classification dispositions, not learning-coverage or acceptance counts.

The education inventory is pinned to UNESCO-UIS's 2015 detailed descriptions of ISCED-F 2013, Appendix I, printed pages 54–58. Text extraction and visual table inspection exposed differences in another institutional reference table; both receipts and the chosen edition are preserved. OECD coverage is limited to 42 second-level fields, library coverage to 21 main classes, and heritage coverage to five indexed domains. The later OECD 403 and heritage CAPTCHA remain explicit stops. No detailed library-schedule or complete heritage-body verification is claimed.

The briefs record source findings that materially change their designs: dependent evidence in the 1917 history pair; the original-text witness and translation rights needed for Bashō; edition-specific Analects numbering; the law page's effective-change date; soil data units and caution flags; a conflicting diaphragm description; and the original demonstrations/recordings still needed for craft and performance. Source links and exact locators are adjacent to each finding in the briefs, with machine-readable receipts in the source register.

The soil pilot additionally includes a [local, reproducible profile](pilots/research/soil-quality.py) and [saved results](pilots/research/soil-quality.json). Its checks establish the inspected snapshot's grain, joins, ranges, flags and hashes. They do not certify laboratory calibration, representativeness or inferred crop-management decisions.

This task's new files are confined to the chat checkout. Neither active Wave 5/6 worktree receives writes or instructions. The original U0 production snapshot above remains dated evidence; the other chats' ledgers continue to supersede it. The [U1 validation receipt](coverage/validation.md) records focused checks and the preservation boundary.

## U2 extension: first two prototypes and continuation contract

**2026-10-22, subsequent implementation task.** The [schema/URL decision](architecture/universal-schema-urls.md) and [master-plan handoff](master-plan-handoff.md) make the additive implementation and remaining gates explicit. The source register now has 42 receipts. History and literature have working, static local prototypes with canonical records, selected-text hashes, evidence/annotation tasks, private local notes and shareable selections. They are authored drafts, not independently accepted lessons.

The [source-resolution record](pilots/research/history-literature-resolution.md) closes text selection and scoped reuse for these drafts. History uses limited attributed phrases and original explanation, with explicit date precision and dependence between sources. Literature fixes the two historical English renditions and a Koto City museum-linked Japanese display transcription; the latter is not presented as an inspected seventeenth-century manuscript. Wider publication and independent specialist review remain separate gates.

The [verification record](verification/universal-pilots.md) records tests, browser inspection, known limits and preservation of the original production files and other worktrees. No active wave ledger, content item, production route or accepted count is updated by these prototypes.
