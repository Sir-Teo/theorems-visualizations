# P06-L02 · What a lung-function measurement measures

Research brief, 2026-10-22. Parent: P06 health and care. Audience: general readers exploring measurement, after the proposed breathing/counting case. Planned only; no patient data, self-test or clinical interpretation. Sources `seq-nhlbi-lung-tests` and `seq-niosh-spirometry` are recorded in [sources.json](sources.json).

## Question and evidence

How do an amount, a rate and an incomplete observation differ? [NHLBI's lung-test overview](https://www.nhlbi.nih.gov/health/lung-tests), updated 4 October 2024, distinguishes spirometry from lung-volume and other tests. An exhaled volume is not automatically all air in the lungs or a measure of gas exchange.

[NIOSH publication 2012-116](https://www.cdc.gov/niosh/docs/2012-116/pdfs/2012-116.pdf), January 2012, supplies a dated technical teaching account: pp6–7 distinguish quantities and quality checks; pp18–19 illustrate early termination, which can distort the denominator of a reported ratio. Those graphs and explanatory text were visually inspected. The historical numerical acceptance criteria, example patient values, predicted values and coaching instructions are not adopted as a current protocol.

The 2019 ATS/ERS spirometry statement's PMC route returned a CAPTCHA; the distinct 2022 ERS/ATS interpretation paper returned 403. Both were stopped without alternate-copy retrieval. Search summaries are not body-reading receipts. A current measurement/interpretation-standard check therefore remains a specific preparation gap, not a completed clinical review.

## Planned exploration and original arithmetic

Use the original [synthetic traces](research/volume-time.json) and [arithmetic audit](research/volume-time.py). Two mathematical traces end at 4 litres but contain 3 versus 2 litres at one second. Their descriptive one-second/end-volume ratios are 3/4 and 1/2. A cropped prefix of the first trace ends at two seconds and 3.6 litres: substituting that observed endpoint gives 5/6, which is larger despite losing information. The crop has no established complete endpoint.

These are authored sample values with an explicitly chosen time origin and piecewise-linear interpolation. They are not measured spirograms, a patient simulation, certified FEV1/FVC results or clinically acceptable manoeuvres. The interface must keep `volume at 1 s / observed end volume` distinct from a validated clinical quantity. Clinical time-zero, calibration, effort, repeatability and acceptability need the uncompleted technical/professional review.

State: trace, sample cursor, unit, crop endpoint and evidence note. Readers compare litres with millilitres, calculate interval-average flow from changes in volume/time, and explain why a smaller denominator can raise a ratio. A static sample table and step controls provide the full task without motion. No breath blowing, withholding medicine, symptom provocation or diagnostic cutoffs are requested.

Success means identifying the measured quantity, retaining units, noticing missing observation and refusing to infer health from this arithmetic. A transfer case asks what additional protocol/quality evidence would be needed before interpreting an actual test. It does not ask the reader to grade an actual patient.

## Preparation gates and release

A respiratory clinician/physiology educator must approve the measurement terminology, current standard, synthetic-trace limitations and rubric before authoring. A smoothly drawn curve, numerically correct ratio or old guide cannot supply that approval. The first pilot's excluded nursing mechanism paragraph remains excluded; this brief does not repair it.

Use original tables/diagrams and source links. NIOSH's p3 expressly labels its document public domain, but no source graph is bundled here. NHLBI video/images and future assets require separate rights decisions. Practical competence, access/learner evidence and release scope remain open.
