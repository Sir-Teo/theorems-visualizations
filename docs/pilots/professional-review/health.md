# P06 qualified-review input: counted synthetic cycles

**Preparation only.** Clinician/nurse educator, physiology reviewer and human-access/learning roles remain unassigned. [health-traces.json](health-traces.json) contains two authored time tables and nine boundary fixtures, with no patient data or runtime identity. There is no self-test or instruction to alter breathing.

## Claim and source decisions

The inspected [NHLBI account](https://www.nhlbi.nih.gov/health/lungs/breathing-benefits), updated 27 June 2025, supports a limited qualitative phase map: inhalation accompanies diaphragm contraction/downward movement; ordinary exhalation accompanies relaxation. Air movement and gas exchange must stay distinct. A future original schematic should show direction and labels only, without measured displacement, pressure, volume, effort or oxygenation values. The lungs are not presented as a closed rigid gas container. Forced breathing and clinical conditions are outside this first schematic's scope.

The opening mechanism paragraphs of [OpenStax Clinical Nursing Skills 15.6](https://openstax.org/books/clinical-nursing-skills/pages/15-6-respiration) still conflict with that account. They remain excluded. The returned page also showed a keep-reading login notice: no subsequent access, alternate copy or linked resource was requested. Neither its diagnostic statements, rate thresholds nor patient cases are adopted. The earlier anatomy textbook receipt is retained historically, without a new body-reading claim.

The conflict is resolved only as a **source-selection decision**: excluded claims are not used. It is not a publisher correction or clinical approval of the proposed schematic. [Source receipts and stops](sources.json) preserve that distinction. Prior NCBI Nursing Skills, 2019 spirometry and 2022 interpretation stops remain in force; this packet does not close the follow-up measurement-standard gap.

## Inspectable timing and boundary conventions

Each time-table row is one explicitly authored cycle: inspiration start, a phase-change label, cycle end. Values are milliseconds. The phase subdivisions have no physiological calibration. Rows join continuously within a 20-second synthetic observation; no value is extrapolated outside it.

H-REGULAR has five four-second cycles. H-VARIED has cycle durations 2, 6, 3, 6 and 3 seconds. Both contain five complete cycles over 20 seconds, giving the descriptive calculation 15 cycles/minute, while their intervals differ. This establishes an arithmetic distinction, not healthy/abnormal classifications.

The primary task counts cycles wholly contained in a stated window, with partial cycles explicitly identified. A separate comparison counts onset landmarks in `[start, end)`. These are different rules. For H-CROP, window 2–18 seconds contains three complete cycles and four onsets; its two descriptive calculations differ. Neither is presented as a validated clinical rate estimator. A zero complete count inside a short partial cycle is not absence of breathing. A window outside the supplied trace is unknown, not zero. Exact endpoint fixtures prevent counting the shared boundary twice.

## Proposed task and observation rubric for review

The future artifact would show the full event table, named convention and window before asking for a count. Pause/step/replay and typed values would be optional aids; there is no speed score, drag-only control, required sound or motion-dependent answer. No interface or human session is supplied by this packet.

| Task | Observable evidence to record in a later session | Inference explicitly withheld |
| --- | --- | --- |
| Identify a complete row | Which start/phase/end labels the reader selected and their reason | Clinical observation competence |
| Apply a window | Exact included/partial IDs and stated convention | A patient measurement or absence of breathing |
| Compare full traces | Reader identifies equal count/duration and different intervals | Diagnosis, effort, depth, oxygenation or gas exchange |
| Explain a crop | Reader notices the boundary-rule difference and missing full cycles | Which clinical protocol should be used |
| Transfer to an unfamiliar table | Explanation of what the data do and do not establish | Real-world performance or statistical learning efficacy |

Record actual responses, assistance, access mode, misunderstood labels and revisions; leave observations blank until performed. Do not score people by agreement with an unstated convention. A future supervised real observation rubric is a separate clinician-approved protocol; this task never asks for a real person's health data.

## Qualified decisions required before authoring

1. Approve or revise every phase label and the quiet-breathing scope. Decide whether the schematic needs additional structures or qualifiers to avoid misleading readers.
2. Approve terminology for the two descriptive counting rules, partial/unknown windows and all nine fixtures. Determine whether complete-cycle density is educationally appropriate given its cropping bias.
3. Review every withheld inference and the table above; identify any remaining clinical implication or misleading visual assumption.
4. Approve a human-access/learning session plan, with actual participant consent and privacy arrangements before any future recruitment. No participant is currently recruited and no patient procedure is proposed.
5. Bind the completed professional decision to exact packet hashes and record qualifications/limits using [README](README.md). This still precedes actual artifact acceptance.

## Assets and release

All supplied numbers and proposed diagrams are original. No external image, audio, textbook passage or measurement is bundled. NHLBI's embedded Nucleus animation is explicitly excluded; displayed website terms do not grant its rights. OpenStax licensing and additional-use terms are not treated as approval for this project. There is no completed clinical review, current spirometry-standard review, public release or physical observation.
