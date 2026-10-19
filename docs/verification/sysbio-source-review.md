# Systems-biology source follow-up — 18 October 2026

Original source follow-up closed sysbio-3.1 and sysbio-3.7; subsequent work and remaining flags are recorded below.

## Evidence

Read the complete original six-page [Mangan & Alon (2003), Structure and function of the feed-forward loop network motif](https://europepmc.org/articles/PMC218699?pdf=render), PNAS 100:11980–11985, doi:10.1073/pnas.2133841100, including all Methods/Results/Discussion sections, Tables 1–3, figure captions and stated limitations. Visually checked both original Tables 1–2 on p. 11981. The author-lab PDF URL returned 503; Europe PMC supplied the full original. Local evidence is under `/tmp/sysbio-primary`.

## Corrections

The shared classification had C2/C4 and I2/I4 swapped. Corrected all four sign triples against the original diagrams, preserving the sign order X→Y, Y→Z, X→Z. This repairs the labels and miniatures anywhere the shared helper is used.

For 3.1, checked historical motif counts and database counting conventions, making clear that the counts describe those source databases rather than a current census. For 3.7, replaced the abstract-only provenance with the paper's actual conditions: strong regulation, saturating binary signals and no basal expression for the conditional steady-state AND result. OR can reverse which configurations retain both input effects. The finite-Hill tiles remain an expressly separate sensitivity screen; their independent-binding OR and added SUM comparison do not reproduce the paper's competitive promoter model. The paper offers functionality as a partial hypothesis for abundance differences, not proof of an evolutionary cause.

## Validation

- `node tests/verification-sysbio-source.test.mjs`: four groups check all eight original sign triples, the source AND truth tables, the independent-binding OR screen's input sensitivity, and exact steady states for every type and all three gate choices.
- `node scripts/check.mjs sysbio --static`: 37 items, zero errors or warnings.
- `node tests/verification-popgen-sysbio-browser.mjs`: serial real Chromium in both themes, pinned KaTeX through `installBrowserAssets`, all eight miniature clicks, edge controls, AND/OR/SUM and sensitivity-tile controls. Final evidence `/tmp/popgen-sysbio-verification-browser.json`; screenshots `/tmp/popgen-sysbio-verification-shots/`.

## Initial-flag coverage ledger

This records the actual review state; a source-location attempt alone is not a completed item review.

| Initial item | Status |
| --- | --- |
| sysbio-3.1 | Closed; evidence and validation above. |
| sysbio-3.4 | Closed; source and validation evidence below. |
| sysbio-3.7 | Closed; evidence and validation above. |
| sysbio-3.8 | Closed; source and validation evidence below. |
| sysbio-3.9 | Closed; source and validation evidence below. |
| sysbio-4.10 | Closed; source and validation evidence below. |
| sysbio-4.5 | Closed; source and validation evidence below. |
| sysbio-4.6 | Reviewed; retained for the precise source gap below. |

## Follow-up: 3.4, 3.8, 3.9 and 4.10

Complete primary PDFs read, including Methods, model assumptions, figure captions and conclusions:

- Mangan, Zaslaver & Alon (2003), *J. Mol. Biol.*334:197–204, [complete8-page paper](https://www.cs.cornell.edu/courses/cs6241/2019sp/readings/Mangan-2003-coherent.pdf), `/tmp/atlas-sysbio/mangan-delay2003.pdf`. Table2p.200 was also rendered and visually inspected. The delay is relative to lacZYA, with saturating IPTG; Table2 ON values are12.6±2/19.6±2min(araBAD/araFGH)at30°C and6.3±1/13.5±2minat37°C. These are standard errors. The original infers promoter activity `(dGFP/dt)/A`; our Z is a concentration proxy, now labeled accordingly. The original includes basal AraC and omits the O2 looping site in the araBAD/araC reporter. Our zero-basal n6 model and arbitrary time units are explicit, and the caption now includes the missing inverse removal-rate factor in its threshold-time expression.
- Zaslaver et al.(2004), *Nature Genetics*36:486–491, [complete6-page paper](https://jyhuang.idv.tw/PhysicsOfSystemBiology_files/Topics%205_SIM%20and%20toggle%20switch%20motifs/L2%20SIM_Just%20in%20time%20Metabolism.pdf), `/tmp/atlas-sysbio/zaslaver2004.pdf`. Figs3–5 establish activation ordering within unbranched pathways, not between converging branches; no LIFO shutdown measurement is claimed. Box1/Fig6 use product-dependent repression, unequal synthesis strengths and an optimization objective. Our identical-rate activation-threshold illustration is explicitly separate. Removed the false claim that rapid input can destroy or reverse its exact pointwise ordering; fast input compresses timing differences. A gene that never reaches half activation is reported as incomplete.
- Kalir, Mangan & Alon(2005), *Molecular Systems Biology*1:2005.0006, [complete6-page paper](https://www.weizmann.ac.il/mcb/alon/sites/mcb.UriAlon/files/kalir_a_coherent_ffl_with_sum_input.pdf), `/tmp/atlas-sysbio/kalir2005.pdf`. Figs1–3pp2–4 establish FlhDC→FliA and additive output activation, FliA autoregulation/FlgM checkpoint, and60–80min prolongation under the induced shutdown protocol. The paper treats OR as a Boolean approximation to SUM; it does not measure our three-gene FIFO design. Both distinctions are now explicit. Shutdown detection now requires a downward crossing, preventing late activation from being mislabeled as shutdown.
- Gardner, Cantor & Collins(2000), *Nature*403:339–342, [complete4-page paper](https://www.math.uh.edu/~josic/old_website/myweb/teaching/reading/Gardner.pdf), `/tmp/atlas-sysbio/gardner2000.pdf`. Box1p339 and Figs2/4–6 establish equations, balanced/cooperative design, plasmid variants, GFPmut3 flow-cytometry readout and transient memory. Fig5 actual fit is alpha1=156.25,alpha2=15.6,beta2.5,gamma1; a new preset loads these values. Both cooperativity exponents need not exceed one. The20-time-unit concentration-rescaling pulses are chosen, not the measured IPTG3–6h/thermal≤35min times; the original IPTG concentration calibration is explicitly not implemented. The design-map root count is labeled a finite-resolution numerical screen near folds. Independent phase-plane axis scales now preserve visibility in asymmetric circuits.

Validation: `node tests/verification-sysbio-followups.test.mjs` passes6independentgroups: analytic symmetric toggle roots; monostability bound and actual-paper asymmetric roots; pulse basin switching and retained state; intermediate closed-form relaxation and asymmetric responses; exact SIM pointwise ordering across27control combinations; directional shutdown detection and18OR-program combinations. `node tests/verification-bio-followups-browser.mjs` uses serial real Chromium, `installBrowserAssets`, native endpoints, all segmented choices/buttons/toggles and a native stage-handle drag in both themes; screenshots and results are under `/tmp/atlas-bio-followups-*`. Source flags are removed only after the final corresponding passes and manual image inspection.

Final closure evidence: all 16 cases in `/tmp/atlas-bio-followups-browser.json` passed; final light/dark screenshots for each of the eight reviewed items were inspected manually. Source flags for sysbio-3.4, 3.8, 3.9, 4.10 are closed.


### sysbio-4.5 closed: lac feedback and the TMG experiment

Read the complete four-page primary paper, Ozbudak et al. (2004), Nature 427:737–740, including Figs. 1–4 and all Methods: https://www.hubrecht.eu/app/uploads/2017/11/2004-Ozbudak-E-Nature.pdf (SHA-256 c416ec098cd0c7f391c271652a0251cbadc8e7c1318970c0a19a127f847175df). The rendered p. 738 was inspected to confirm that the glucose-free thresholds are approximately 3 and 30 **µM**, not the mM produced by text extraction. Cells were grown for 20 hours with non-metabolised TMG and independently varied glucose; chromosomal lac–GFP and gat–HcRed report distinct regulatory inputs. These are not the demo's dimensionless concentration units or a fit of its two-variable reduction. The original paper's reduced repression factor and transition to graded behaviour are distinguished from our Hill-exponent slider.

Corrected the claim that any n>1 and strong promoter guarantee a window: basal expression and transport also matter. Removed a numerical branch-joining artifact that drew a spurious jump from a terminated stable branch to the remaining branch. The histogram now includes all simulated cells at slider extremes. Seven independent test groups pass in `node tests/verification-sysbio-followups.test.mjs`; the added group derives the n=2 equilibrium cubic discriminant and the full two-dimensional Jacobian independently, including monostable n=1 cases. Final real light/dark native cases pass, with both images inspected: `/tmp/atlas-sysbio-lac-browser-final.log` and `/tmp/atlas-bio-followups-shots/sysbio-4.5-{light,dark}.png`.


### sysbio-4.6 reviewed, retained for biochemical source gap

Read the complete relevant Results, Figs. 1–5, Discussion and main experimental procedures of Zeng et al. (2010), Cell 141:682–691: https://bacteriophysics.web.illinois.edu/wp/wp-content/uploads/2019/02/zeng-cell-2010.pdf. Single-phage microscopy distinguishes infection failure, growth arrest, lysis and lysogeny. The whole-cell probability does not collapse as a function of MOI/cell length alone; the individual-phage probability does, with fitted Hill h=2.07±0.11 and K=1.17±0.02 (SEM), and whole-cell lysogeny follows its mth power. This supports a unanimous-voting interpretation in that experimental system, with altered behaviour in dnaJ hosts, rather than proving that a generic two-repressor switch derives all outcomes. Supplementary procedures are not claimed inspected.

Corrected the inference that reciprocal repression alone entails MOI and UV responses, stated the complete chosen three-variable equations and arbitrary units, and distinguished continuing toy CII synthesis from real establishment. The finite 80-unit endpoint scan is now a sampled high-Cro criterion, not a proven saddle-node or calibrated UV threshold. Eight independent sysbio groups pass, including positivity, exact nullcline substitution, establishment/maintenance distinction and time-step refinement. Four retained-item native theme cases (lambda and resistance) pass and their images were inspected in `/tmp/atlas-bio-resistance-lambda-browser.log`.

The flag remains specifically because the complete original biochemical source for activated-RecA-facilitated CI autocleavage and the CI/Cro promoter architecture has not been inspected. The attempted Little (1984), PNAS 81:1375–1379, PMC PDF route returned an HTML challenge, not a paper. Zeng's infection decision experiment does not fill that molecular-source gap.


Final assigned-item status and precise retained claims are recorded in `bio-followup-status.json`; no assigned item is genuinely unreviewed. All metadata prerequisites/references were synchronized to the corresponding syllabus entries. The combined independent/regression suite passes 44 groups, the final scoped static check covers 135 items with zero errors or warnings, and the final retained-item native browser pass is `/tmp/atlas-bio-retained-browser-final.log`. Earlier progress counts above describe their checkpoints rather than the final totals.


### Bounded final public-source pass

On 18 October 2026 targeted new ordinary public author/university-library searches for Little (1984) and the original CI/Cro promoter work returned references, abstracts and later discussions, but no new complete biochemical original. No blocked PMC route was repeated and no abstract was accepted as primary closure. sysbio-4.6 retains the exact activated-RecA/CI-autocleavage and promoter-architecture source gap. See `retained-source-followup-climate.md`.
