# Master plan: an explorable atlas of human knowledge

> **User-directed continuation · 2026-10-23:** Independent AI, professional, engineering, practitioner, learner and screen-reader reviews are no longer prerequisites for local authoring, acceptance or integration preparation anywhere in this roadmap. Continue with source-backed authoring, automated checks and explicit author-verification records. Retain prior reviews as history and unperformed observations as limitations; do not claim they passed. This direction supersedes conflicting review gates below and in earlier briefs. The two-draft limit is a batch-size preference, not a reason to wait for optional reviewers. Public distribution and real-world evidence remain separate from local completion. See [the current verification record](docs/verification/universal-author-continuation.md).


> **Revision 4 · 2026-10-23 · local delivery.** Working name: *Ideas, Visualized*. The user selected an atlas on their own computer; public hosting is outside this delivery. The prior plan remains in [the local-baseline archive](docs/integration/master-plan-local-baseline.md).
> This revision expands the scope and roadmap. It preserves accepted content, stable IDs, frozen wave assignments, source restrictions, and current production requirements.
> The preceding plan is preserved verbatim in [the Revision 2 archive](MASTER_PLAN_V2_ARCHIVE.md); its progress figures and future instructions are historical.
> The accepted base’s plan is separately preserved verbatim in [the integration baseline archive](docs/integration/universal-pilots-baseline-plan.md). This branch adds the pilot package to accepted source `facab15e297c645d4826935f2c011a4cf367ee88`; ongoing expansion and redesign stay in their owning worktrees.
> **Future universal-atlas work starts with [the continuation handoff](docs/master-plan-handoff.md).** It identifies the finished local package, reproducible checks, preservation boundaries and continuing content stewardship.

> **Integration checkpoint · 2026-10-23:** [The complete candidate](docs/integration/master-plan-candidate.md) pins all seventeen feature/research packages through `e61efc42`, with passing combined builds and 181 offline tests. This is local integration evidence; the full U0–U5 roadmap and recorded acceptance/release gaps remain open.

> **Wave integration · 2026-10-24:** The user explicitly requested pushing `codex/wave-six-expansion` and merging its committed work into `main`. This integration combines that branch through `84d784cb` with the existing universal-atlas delivery. Uncommitted GEO 6 drafts and other worktree changes remain local. This specific authorization supersedes earlier local-only instructions for this merge; it does not authorize deployment. See [integration verification](docs/verification/wave6-main-merge.md).

## 0. The mission

Build a living, explorable atlas of human knowledge: **what people know, how they know it, how they use it, how ideas connect, and where uncertainty and disagreement remain—across disciplines, cultures, places, and time.**

“All human knowledge” is the organizing ambition. It is not a finite item count or a promise that a single canon represents everyone. The atlas must accommodate formal results, empirical findings, historical evidence, interpretations, values, creative works, technologies, institutions, and practical know-how. New subjects and overlooked traditions must be addable without rebuilding the product.

The existing mathematical and scientific atlas is the foundation. Its 85 collections retain their identity, depth, URLs, and production history. Expansion adds missing territory and ways to investigate it. Readers should be able to prove, experiment, compare sources, interpret, listen, make, and practice.

| Layer | Reader experience | Completeness promise |
| --- | --- | --- |
| Orientation | Domain maps, essential questions, methods, timelines, vocabulary, and routes into unfamiliar subjects | Coverage of a versioned domain inventory, with gaps visible |
| Authored exploration | Sourced explanations, interactive investigations, cases, and guided practice | Acceptance of the published syllabus for a collection or release |
| Reference and discovery | Routes to books, papers, archives, datasets, objects, recordings, and specialist collections | Maintained access to deeper knowledge; external links do not count as authored lessons |

Do not publish a percentage of “all human knowledge.” Publish coverage against named inventories, methods, places, languages, and learning goals.

## 1. Where we are, and what must survive

### 1.1 Evidence baseline

**Snapshot: 2026-10-22, checked against expansion HEAD `04120914` and redesign HEAD `2efc5984`.** Other work is active; later chapter ledgers supersede this snapshot. Written, author-verified, independently accepted, and redesigned are different states.

| Track | Recorded state | Consequence |
| --- | --- | --- |
| Wave 5 | Complete: 1,031 new ideas / 80 frozen chapters. Completion `1f6ddc37`; accepted source `fdcb3fd55a5d6a036f0d57443d3b5259d007825d` | Preserve; never restart from an older checkout |
| Wave 6 accepted | 36 / 1,057 new ideas: ML 6 (16), VCALC 6 (10), PDE 6 (10). Accepted source `facab15e297c645d4826935f2c011a4cf367ee88`; continuation base `f0a324f9` | 1,021 frozen new ideas still require acceptance; 80 chapter assignments and two preserved entries stay fixed |
| Accepted atlas | 7,751 written / 5,823 planned ideas, 531 written chapters, 85 collections, 13 fields | This 13,574-item inventory is the existing syllabus, not the boundary of knowledge |
| Accepted integration | Recorded 3,457 passing tests, strict build/static clean; 123,750-byte gzipped home JSON; 15 bridges / 182 steps / 179 unique written ideas / no unresolved steps | Historical evidence for that source, not current drafts |
| Active expansion (updated 2026-10-24) | 606 frozen new ideas present through GEOL 6 at `84d784cb`: 36 in the accepted export + 570 additional author-verified ideas. GEO 6 has unfinished local drafts, excluded from this merge | The accepted export remains 36/1,057. Preserve exact author-verification evidence in [the Wave 6 handoff](docs/wave-continuation.md); no additional independent review is claimed |
| Preserved shipping drafts | ODE 6 (17) and ALG 9 (17), unaccepted | Preserve and reconcile through their review pipeline; do not duplicate authorship |
| Visual redesign | 55 verified / 1,101 scoped items; 1,046 pending | Scope includes Wave 5, 36 accepted Wave 6 items, and 34 shipping drafts. The 66 newer expansion items are outside its denominator |
| Flagship proof curation | 2 / 100 accepted | Separate from the historical 102-player control audit and visual redesign |
| Full-map performance | 60 fps target unmet and deferred by user direction | Not a content-wave gate; do not restart renderer/timing work through this revision |

All 64 existing non-math collections meet the historical 25 published cross-field-edge target at the accepted baseline. This measures recorded links, not their semantic or source quality.

### 1.2 Operational sources of truth

The chat checkout may be older than the accepted atlas. The active content worktree is:

`/Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations`

Read its `docs/wave-continuation.md`, `docs/wave-6-plan.json`, `docs/wave-6.md`, and `docs/verification/wave6-production.md` for execution. Shipping drafts remain in `/Users/teodev/.codex/worktrees/wave-five-shipping/theorems-visualizations`. The redesign ledger is `docs/verification/wave5-visual-redesign.md` in `/Users/teodev/.codex/worktrees/wave-visual-redesign/theorems-visualizations`.

These are current workspace locations, not permanent architecture. Commits and repository-relative ledgers are durable references. U0's plan and two companions were synchronized to the chat and active expansion worktrees; archives preserve each checkout's own old plan. The subsequent U1 registry and pilot-research delivery is isolated to the chat checkout. It is not copied into either active worktree while those chats continue; reconcile it at the normal integration boundary. The redesign checkout remains under its existing task.

### 1.3 Preservation contract

1. Keep every existing collection/item ID, numbering, citation, accepted manifest, and legacy URL. Use aliases and cross-listing for new navigation.
2. Keep Wave 6 frozen, including FLUID 6.14 and FIN 7.10. Universal expansion gets a separate inventory; never insert new collections into a frozen wave.
3. Continue authorized waves through their existing gates. Wave 6 does not wait for the universal platform.
4. Preserve uncertainty flags and source-access stops. The five residual flags in one historical audit are not the whole atlas's unresolved inventory. The BIGHIST 3.5 review stop and excluded BIGHIST 3.5 → PMA 8.6 edge remain binding; this revision does not reopen them.
5. Integrate visual changes against exact accepted content versions. Visual review cannot accept an unreviewed draft; content review cannot imply redesign completion.
6. Preserve unrelated dirty files and ongoing worktrees. Subsequent integration uses reviewable local commits; no PR, push, merge, or deployment is authorized here.
7. Treat the archive as historical evidence. Current handoffs and explicit user directions govern execution where old instructions conflict.

## 2. Principles

**Breadth with depth.** Keep advanced mathematics while creating entrances to subjects with no adequate coverage. Orientation, introductory explanation, advanced treatment, and practice are distinct levels.

**Methods fit the subject.** Proof establishes mathematical implication; experiment supports an empirical claim within limits; a source supplies historical evidence; interpretation offers a reasoned reading. A demonstration supports skill development without certifying mastery.

**Evidence is visible.** Separate source statements, reconstruction, observation, model output, uncertainty, and interpretation. A simulation is not an observation, and a debated account is not a settled fact.

**Global coverage is structural.** Region, period, language, tradition, and community are facets throughout the atlas, not a single “world cultures” shelf. Include exchange, unequal preservation, translation, and attribution. Compare supported interpretations without assigning unsupported empirical claims equal evidential weight.

**Interaction serves understanding.** Every authored exploration gives the reader an action: manipulate, predict, inspect, compare, explain, compose, or practice. An arbitrary slider does not satisfy this requirement.

**Multiple entrances.** Beginners need not traverse the full formal prerequisite closure to understand an intuition. Different routes make different, explicit promises.

**Accessible and durable.** Retain static deployment, progressive loading, offline-friendly core lessons, semantic text, keyboard operation, and reproducible states. Optional media and external collections fail gracefully.

**Versioned coverage.** Each syllabus/inventory declares scope, sources, omissions, review date, and maintainer. Completion applies to that version, never to a discipline forever.

## 3. Information architecture

### 3.1 Add coverage without renaming the atlas

The [coverage map](docs/universal-coverage.md) and [versioned coverage registry](docs/coverage/README.md) define **30 planning domains**, with gaps, current collections, and exploration ideas. These are research/navigation views, not newly implemented runtime fields.

Keep field → area → collection → chapter → item and the current 13 field IDs. Add many-to-many domain mappings and facets. Irrigation can appear under agriculture, engineering, environment, and history while remaining one canonical item.

Use external classifications for gap detection rather than as the sole ontology. UNESCO education fields, OECD research fields, library classification, and living-heritage categories serve different purposes and have limits. See the [research record](docs/universal-atlas-research.md).

### 3.2 Separate four schema questions

| Question | Proposed representation | Compatibility |
| --- | --- | --- |
| What is it about? | Domains, topics, places, periods, languages, traditions, audiences | Existing field/area/collection stays valid |
| What sort of knowledge is it? | Formal, empirical, historical, interpretive, normative, procedural, creative; multiple allowed | Do not infer certainty from `kind` |
| How is it explored? | Proof, experiment, source comparison, argument, annotation, case, practice, performance, object/map | Existing `viz` remains supported |
| What has been checked? | Authorship, source review, content/model review, independent acceptance, visual review, accessibility, learning evaluation | Do not collapse these into `written` or one “verified” badge |

The [additive schema and URL contract](docs/architecture/universal-schema-urls.md) fixes these fields for the pilot series, with executable validation and a tested legacy adapter. Argument, measured-data, practice and performance payloads are implemented locally. The [legacy evidence view and sidecar contract](docs/architecture/legacy-evidence.md) now add optional production loading for existing ideas, with an empty real registry and a pinned local integration rehearsal. The [static legacy reading candidate](docs/architecture/static-reading.md) adds 7,751 idea pages, aliases and canonical/sitemap support without deploying them. The [exploration edition candidate](docs/architecture/exploration-editions.md) adds catalogs, immutable version routes, retained source/runtime evidence and withdrawal mechanics; its real release ledger is empty. The [notebook candidate](docs/architecture/exploration-notebooks.md) adds explicit reversible note copying, guarded undo and cross-origin file recovery, including withdrawn editions. The [domain navigation candidate](docs/architecture/domain-navigation.md) joins all 30 reviewed orientations to 85 distinct collection entrances and four locally accepted exploration identities, with question/method/route filters and bounded release/withdrawal handling. The [journey reader candidate](docs/architecture/journey-reader.md) now assembles three static cross-field routes against exact delivered destinations, withholding a route when a required target is unavailable. All eight pilot formats now run locally. The [local programme](docs/architecture/local-program.md) adds a general series contract, English/Spanish editions, thirty deeper routes with complete declared prerequisite closure, source discovery and optional practice notes. Existing chapters and notes require no migration. Public rollout is outside the user-selected local scope.

Retain book-anchored and curated-course collections. Add archive, casebook, practice-sequence or annotated-corpus types only when pilots justify them. Keep canonical idea IDs separate from identifiers for sources, works, datasets, people, places, and events.

### 3.3 Typed connections

Retain `deps` for actual prerequisites of the supplied explanation/proof. Add relationships such as *applies*, *analogous to*, *contrasts with*, *influenced*, *evidence for*, *challenges*, *part of*, and *version/translation of*.

A nontrivial relation needs a rationale and, where relevant, a source. Influence is not implication; analogy is not evidence. The prerequisite graph remains acyclic; the wider graph may contain cycles. Never run the prerequisite planner over every semantic relation.

Preserve old dependencies until reviewed. Do not relabel mathematical prerequisites simply to manufacture shorter paths.

## 4. Extend the platform that already works

The registry, sharded catalogs, field/collection pages, search, map, timeline, bridges, numeric runtime, visual kits, sharing, and embeds already exist. Revision 2's engine phases are historical.

| Work package | Concrete change | Acceptance evidence |
| --- | --- | --- |
| Coverage registry | Versioned domains, many-to-many mappings, gaps, classification references | All 85 collections mapped; no ID changes; prospective entries cannot inflate authored totals |
| Evidence/review metadata | Claim locators, editions/dates, data/model distinctions, review scope and unresolved reasons | Old content renders; `verify: true` survives; UI names the actual uncertainty instead of calling every flag an unverified number |
| Relations and routes | Separate semantic links and proof prerequisites; intuition/applied/formal paths | Old prerequisite results unchanged; route assumptions and missing steps visible |
| Accessible exploration | Semantic descriptions, readouts/tables, equivalent focusable controls, non-drag input, captions/transcripts | Pilot tasks completed by keyboard and single pointer without dragging; screen-reader review of equivalent content |
| Source/text/media tools | Source alignment, annotations, competing readings, timed media, object inspection | Provenance/rights visible; text fallback; core explanation does not require an external service |
| Discoverable pages | Pre-rendered HTML, stable path URLs, canonical metadata, sitemap; legacy hash redirects | Old links and states resolve; useful text without client rendering; static hosting works |
| Check coverage | Map shared-helper/runtime changes to affected chapters; separate quality checks | Changes to shared code check affected pages; warning policy explicit |
| Coverage dashboard | Separate planned/authored/accepted/redesigned/accessibility-reviewed counts and review age | Reconciles to exact ledgers with declared denominators |

Use small adapters and reusable components. Heavy media loads only when needed. Preserve the ≤300 KB gzipped home-JSON budget and catalog sharding; do not eagerly load a universal graph. Map renderer optimization remains deferred.

## 5. Broaden the actual territory

The atlas has substantial formal and quantitative coverage. General history and archaeology, literature, religion, law, anthropology, education, business/accounting, agriculture/food, care professions, many biological and chemical disciplines, computing practice, performance, crafts, and everyday skills need explicit scope.

The [30-domain map](docs/universal-coverage.md) maps **all 85 current collection IDs** and specifies additions and reader actions. A collection is a foothold, not proof that its whole domain is covered.

Track subject, method, depth, place, period, language/tradition, and accessibility. A world-history overview with only European examples and a history page without source analysis have different gaps; expose both.

New collections require scoped bibliography and syllabus audits. Do not create a shallow lesson for every vocabulary term, artwork, organism, place, or event. Reference indexes handle long-tail discovery; authored exploration is for material where explanation or practice adds value.

## 6. Ways to explore knowledge

| Exploration | Reader action | Required honesty |
| --- | --- | --- |
| Formal proof / construction | Change hypotheses, build examples, follow an inference, find counterexamples | Exact claim and proof obligations; examples do not prove the general case |
| Empirical investigation | Predict, sample, compare data, change analysis, examine uncertainty | Origin, units, measurement limits, missingness, assumptions; observation versus simulation |
| Mechanism / system | Trace a process, change conditions, inspect feedback/failure | Scope, parameter meaning, numerical limits and alternatives |
| Historical source laboratory | Compare accounts, trace provenance, test chronology | Author/date/place, perspective, preservation gaps; evidence versus inference |
| Argument / ethical inquiry | Reconstruct premises, test objections, compare values/consequences | Validity versus truth; empirical versus normative premises; serious alternatives |
| Annotated text / translation | Align variants, examine rhetoric, compare readings | Edition, translator, ambiguity, textual witness, context, excerpt rights |
| Case / institution | Vary facts in documented or explicitly hypothetical cases | Jurisdiction/date where relevant, authoritative sources, uncertainty |
| Guided practice / making | Plan, order, perform, diagnose, record, reflect | Observable criteria, context/materials, error feedback; physical practice/supervision limits |
| Art / sound / performance | Listen, watch, compare interpretations, compose, follow scores/gestures | Work/performer provenance, cultural context, media rights and accessible alternatives |
| Object / space / time | Inspect anatomy, artifacts, landscapes; overlay evidence | Reconstruction versus surviving object, scale/projection, uncertain dates/boundaries |

Reuse existing kits where suitable; add source, text, argument, case, and practice components just in time. A timeline or image alone is not a finished exploration: give the learner a meaningful question and evidence.

Use **orient → predict/question → explore → explain → transfer → revisit**. Include worked examples and retrieval/explanation prompts while allowing free exploration. These are research-informed design hypotheses, not demonstrated learning gains for this atlas.

## 7. Authoring and acceptance

### 7.1 Rulebooks and expertise

[AUTHORING.md](AUTHORING.md), [field guidance](docs/fields.md), and chapter briefs remain operative. New formats need addenda and accepted examples before bulk production. This revision does not silently relax an existing wave's visualization or review rules.

Extend guides with evidence conventions, source languages, uncertainty, accessibility, rights, and method-specific assessment. Use claims appropriate to the available evidence and author expertise. Independent review is optional under the user instruction; record actual roles and never infer professional, community or practical authority from automated checks.

### 7.2 The production line (per collection)

1. **Research scope.** Compare accessible reference contents, specialist curricula/classifications, and primary or authoritative sources. Record actual reading, editions, dates, omissions, and access limits. Search snippets or syllabi locate material; they do not verify every claim.
2. **Freeze a bounded inventory.** Preserve the current `num, kind, name, deps, refs, pic` contract for frozen waves. Once supported, new collections add intended methods, audience, cultural/geographic scope, and acceptance criteria. Version before authoring.
3. **Write the brief.** Specify questions, source/model boundaries, varied formats, prerequisites, accessibility, and meaningful reader tasks.
4. **Author and check.** Follow current constraints; run scoped source/model/content and native-input checks. Preserve genuine failures and repair them. Avoid tests that merely repeat implementation.
5. **Verify the artifact.** The author checks sources, modes, inputs, outputs and pixels. Independent reviews are optional under the user instruction. Record actual limitations and repair observed failures; do not invent observations.
6. **Accept exact versions locally.** Bind the author verification to content and runtime. Keep historical independent receipts, redesign, observed access and learning evidence distinct. Preserve old editions and notes.
7. **Integrate.** Reconcile dependencies/cross-listings, affected bridges, home entries, coverage and ledgers. Run integration checks once per meaningful accepted batch under the handoff.
8. **Commit locally.** Select intended paths only. No push, PR, merge, or deployment. Workspace, concurrency, browser, source-access, and ownership constraints remain as recorded in the active handoff.

Existing continuous content work proceeds under prior authorization. The universal backlog is a separate execution sequence; proposing a lesson/component does not mean it exists or passes review.

### 7.3 Gates at the end of each wave or release

**Frozen waves retain current gates:**

- Zero strict-build errors and unknown dependencies into written collections.
- Every non-definition has a passing visualization under the existing contract.
- Source/model correctness, independent review, native-input/audio and pixel checks, honest uncertainty.
- Existing non-math collections retain the ≥25 accepted cross-field-link gate; never pad it with unjustified dependencies.
- Touched bridges reconcile; home JSON stays ≤300 KB gzipped.
- Refresh progress only from the accepted export after all required gates.
- Map 60 fps remains deferred and unmet; it is not a content-wave gate.

**New universal releases add these gates after U2 implements their contracts:**

- The exploration fulfills its reader task using a method appropriate to the knowledge.
- Sources, editions/dates, model/interpretation boundaries, rights and review status are inspectable.
- New components provide equivalent keyboard/non-drag operation and applicable text/media alternatives. Review relevant WCAG 2.2 criteria; pilot checks do not establish site-wide conformance.
- Each collection has justified prerequisites/related links and at least one meaningful route into the atlas. A fixed edge quota is not the universal coverage metric.
- Pilot learners attempt explanation/transfer tasks; observed failures inform repairs. Formative findings do not establish statistical efficacy.
- Unique items, cross-listings, authored lessons and external resources are counted separately.

Future inventories adopt broader contracts only when schema and guides support them. Never declare a frozen wave complete under weaker rules.

## 8. Exploration and connective tissue

Offer entrances **by question**, **discipline**, **method**, **place/time**, **object/practice**, and **connection**. Readers might ask how we know what happened, how societies feed themselves, or what makes an argument convincing.

Keep all 15 current bridges and the 100-proof-stepper curation goal. Add journeys spanning forms of knowledge:

- **Water and a city:** physics → infrastructure → public health → governance → history.
- **A woven cloth:** geometry → materials → agriculture → trade → cultural practice.
- **How an account becomes evidence:** archives → statistics → law → journalism.

Offer **intuition**, **applied**, and **formal/deep** routes to an idea, labeled with what each enables and omits. Full prerequisite closure remains available, without becoming the default beginner promise. Shorter routes must actually supply the explanations they rely on.

Eventually record what learners attempted or can explain; a “known” checkbox is not mastery. Preserve local/offline progress. Accounts, a personalization model, and a tutoring service are not prerequisites.

## 9. Concrete roadmap

Use **U0–U5** independently of content Wave 6, Wave 7, and later numbered waves. Roles below are execution responsibilities, not appointments already made.

| Milestone | Deliverables | Dependencies / owner role | Exit criteria |
| --- | --- | --- | --- |
| **U0 · Preserve and reframe** | Revision 3, coverage map, research record, archived plans, accepted/draft/redesign baseline | Current task; integration owner | Documents agree; all 85 collections mapped; old plans recoverable; frozen inventories and accepted assets unchanged |
| **U1 · Audit territory** | Machine-readable versioned coverage registry; detailed crosswalk against education, research, library and heritage categories; eight pilot briefs; additive schema/URL proposal | U0; coverage editor, domain reviewers, platform owner | Each external category mapped or explicitly excluded/flagged; all 30 domains have gaps, sources, scope and proposed maintainer; eight feasible source/rights/reviewer plans |
| **U2 · Prove new formats** | Eight accepted pilots; evidence/review adapter; source/text/argument/practice components; accessible patterns; route prototypes | U1 pilot briefs; authors and platform owner | One accepted exploration per pilot; legacy IDs/content intact; keyboard/non-drag/text tasks work; evidence labels correct; author source/model/native checks pass; unperformed observations remain labeled |
| **U3 · Make breadth navigable** | 30 researched overviews; three-lesson sequence per pilot (24 total, including U2's eight); three cross-method journeys; coverage dashboard; static/legacy route support | U1 inventory + U2 contracts; editors, platform owner | All overviews show scope/gaps and a real next step; 24 lessons accepted; three journeys have no missing claimed lesson; links/counts/accessibility pass |
| **U4 · Broad first curriculum** | At least three accepted introductory explorations associated with each domain; scoped introductory syllabi, deeper routes, next collection batches | U3; collection editors and reviewers | 30/30 domains meet the target; cross-listed items counted once globally; method/region/language audit completed; existing depth/waves preserved |
| **U5 · Sustain and deepen** | Versioned releases; specialist depth; regional/language editions; source federation; corrections/review queues; practical-learning partnerships | U4, recurring; editorial stewardship | Each release has an explicit scope, responsible decision-maker, actual evidence and reproducible version bindings; no “all knowledge complete” claim |

**Current local implementation, 2026-10-23:** All eight pilot families now have three authored, author-checked lessons: **24 current lessons**, retained as **28 immutable editions** including the four earlier versions. The 30 domain orientations connect to these editions and the 7,751 accepted legacy reading pages. All three cross-field journeys are accepted locally: 11 exact lesson stops and three explicitly external readings, with no claimed lesson gap. Nothing is publicly released by this status.

The [introductory curriculum](curriculum/introductory.json) supplies three exact accepted starting targets for each of 30 domains: **90 associations to 65 distinct existing lessons**, not 90 newly authored lessons. Every route includes bounded tasks, conceptual entry support, declared prerequisites and explicit method/place/language limitations. This meets the introductory association target while exposing substantial subject and representation gaps; it does not establish broad mastery or a complete syllabus in every field.

**Local completion extension:** Four additional original studies now cover catalog literacy, learning evidence, a fictional accounting ledger and art interpretation, each in English and Spanish. They use independent series identities and immutable source/runtime editions. Together with the pilots there are **28 current authored local lessons**; language editions and route wrappers are not counted as new lessons. Thirty deeper routes reference forty distinct focal targets, with zero missing declared prerequisites and zero cycles. The source browser contains the retained coverage receipts and four bounded records from two metadata providers. Optional practice activities produce user-controlled note downloads, without inventing observed results.

The durable computer-only bundle and launcher live in `/Users/teodev/Developer/atlas-local/`. Use `Start Atlas.command`; no hosting account, public release or cloud service is needed. See [local operation and completion](docs/architecture/local-program.md). The local implementation is a completed versioned baseline, while the territory it can represent continues to grow.

The [current execution ledger](docs/master-plan-execution.md), [handoff](docs/master-plan-handoff.md) and [integration delta](docs/integration/universal-author-continuation.md) describe the concrete build and verification. Run `node scripts/master-plan-status.mjs --as-of YYYY-MM-DD` for current counts instead of reading the historical dashboard as live data. The original 30-domain registry, 85 primary collection homes, 217 classification rows and 45 canonical source receipts remain unchanged; supplemental lesson evidence has its own exact bindings.

U5 now has author-owned source issue tracking, immutable editions, notebook recovery, local bundle installation, release/withdrawal mechanics, classification-reference adapters, two bounded metadata-provider adapters, bilingual studies and private practice-note exports. Four source issues and eleven classification questions retain their explicit uncertainty. More specialties, languages, situated sources and real practical partnerships are continuing editorial growth; no recruited partnership or observed session is claimed. Public distribution is outside this local delivery. Independent review is not a prerequisite for continuing local implementation; missing evidence limits the claim that can be made.

All earlier research packets, review receipts, access stops and the pinned `e61efc42` integration rehearsal remain historical evidence. Their older counts and review requirements do not override this current state or the user’s removal of local review gates.

### 9.1 Eight pilot briefs for U1

| Pilot | Bounded first exploration | Capability tested |
| --- | --- | --- |
| History and archaeology | Compare two sourced accounts of one episode, with an artifact/map where appropriate | Provenance, evidence versus inference, uncertain chronology |
| Literature and language | Compare lawful editions/translations of a short passage and annotate a defensible difference | Parallel text, ambiguity, rhetoric, language metadata |
| Philosophy and religion | Reconstruct a specific argument about obligation from two contextualized traditions | Premises, objections, normative claims, contextual comparison |
| Law and institutions | Trace a hypothetical dispute under one named jurisdiction/date using authoritative rules | Case branching, facts versus authority, temporal scope |
| Agriculture and food | Investigate germination or soil-water conditions using sourced observations and a separately labeled model | Practical context, measurement/model distinction, environmental variation |
| Health and care | Explore one anatomical/physiological process and a supervised observation rubric, with appropriate expert review | Spatial explanation, care context, limits of simulation |
| Craft and making | Plan and inspect a paper weave using an original/licensed demonstration and physical-practice rubric | Sequencing, materials, mistakes, tactile knowledge |
| Performance | Compare original/licensed interpretations of a short rhythm, phrase, or movement | Timed annotation, expressive choices, audiovisual/text alternatives |

Concrete topics, source passages/data, reader tasks, acceptance checks and unresolved gates are now in the [pilot briefs](docs/pilots/README.md). The researched set uses the Zimmermann telegram, Bashō translations, reciprocity, consumer goods law, soil-water measurements, breathing observation, paper weaving and an original performance phrase. Freeze each local lesson after its source/rights scope and author checks are explicit. These test formats, not global representativeness. Include at least three regional/tradition contexts and two source languages across the set, recording exactly what language evidence is available. English and Japanese source material has been inspected; specialist language review remains outstanding. This is a pilot diversity floor, not a claim of cultural completeness.

### 9.2 Sequence and capacity

1. Preserve Wave 5/6 ownership, accepted snapshots and earlier edition/note identities.
2. Use the current 24-lesson workshop and 30-route curriculum as the starting implementation.
3. Choose the next bounded subject gap from a route’s `remainingBreadth`; research actual sources and record access/rights limits.
4. Author and run the source/model/native checks. Record an author verification; optional reviewers do not block local work.
5. Freeze changed content or runtime as a new version, retain previous editions and prepare a fresh candidate with exact inputs.
6. Advance source/classification issues only on actual new evidence. Keep unresolved claims bounded while independent work continues.
7. Prepare any real distribution against its actual destination and material terms; do not equate a local build with publication.

Two drafts at a time is a manageable batch preference. Complete their author checks and continue; there is no waiting queue for mandatory external reviews. Existing content-task concurrency limits remain authoritative.

There is no defensible calendar forecast yet. U2 measures sourcing, authoring, engineering and review effort separately, then informs U3/U4 estimates. The old three-day trilogy rate is not a forecast for law, translation, oral history, care or practical skills.

### 9.3 Measures

| Dimension | Measure and denominator |
| --- | --- |
| Breadth | Reviewed overviews / 30-domain inventory; domains meeting introductory target / 30 |
| Depth | Accepted entries / each frozen syllabus; introductory versus advanced coverage |
| Review | Accepted / authored; unresolved issues by reason; review age; draft backlog |
| Experience | Redesigned / declared scope; accessibility-reviewed / applicable components and lessons |
| Learning | Observed task completion, explanation/transfer errors, usability barriers; later studies require a defensible design |
| Representation | Place, period, source language, tradition, omissions and reviewer coverage |
| Connection | Sourced, useful relationships and viable routes; unresolved/misclassified links |
| Sustainability | Effort per accepted exploration, bottlenecks, broken references, update workload, media/storage budgets |

Set learning outcome targets after pilot baselines. Production targets are commitments, not proof of educational quality.

## 10. Risks and controls

| Risk | Response |
| --- | --- |
| A larger taxonomy disguises shallow coverage | Distinguish overview, introductory, advanced and reference-only states |
| Quantitative formats distort interpretation or practice | Method-specific contracts and accepted pilots before scale |
| An English/Western canon becomes the default whole | Cross-cutting audits, contextual naming, language review and locally informed reviewers |
| False certainty or false balance | Attribute interpretations; weigh empirical evidence; retain contested scope |
| New work erases accepted progress | Stable IDs, exact accepted versions, frozen waves, reconciled redesign integration |
| Sources/media cannot be used or verified adequately | Check rights/access before freezing; original explanation and permitted excerpts; honest unresolved status |
| Simulation implies professional/practical competence | Separate conceptual learning and supervised real-world assessment |
| Volume outruns review | Small batches, reviewer ownership, bounded backlog |
| Federation becomes brittle | Stable references, version metadata, link maintenance, text fallbacks; no live third-party dependency for core lessons |
| Master plan becomes another stale log | Dated strategic baseline; operational counts in ledgers; milestone-level revisions |

## 11. Decisions adopted

1. Retain *Ideas, Visualized* and the named Rudin collections.
2. Adopt all human knowledge as an open-ended ambition with orientation, authored exploration and reference layers.
3. Adopt the 30-domain map as the first planning inventory, not a final ontology or runtime migration.
4. Preserve existing content, IDs, evidence, ongoing work and frozen assignments.
5. Add appropriate exploration methods, typed relationships, evidence metadata and accessible routes through pilots.
6. Replace “roughly 12,500 ideas completes the atlas” with versioned coverage and stewardship.
7. Keep content acceptance, redesign, accessibility and learning evaluation distinct.
8. Run U0–U5 alongside content waves; do not reopen map-performance or source-review stops.
9. Preserve local-only integration and operational constraints.
10. Treat the [research record](docs/universal-atlas-research.md) and [coverage map](docs/universal-coverage.md) as part of this plan. Collection syllabi still require deeper topic-specific research.
