# Ecology competition chapter: source review, 18 October 2026

Eight source flags remained after the separately completed plankton verification. This follow-up closes ecol-4.1 and preserves seven flags, each with a specific evidence gap. Existing plankton and overlap-matrix helpers were preserved.

## Evidence read

- [Connell (1961), Ecology 42, pp. 710–723, complete original scan](https://campus.lakeforest.edu/menke/PDFs/Bio373/Connell_1961_Ecology.pdf): methods, all result sections, Figs. 1–5, discussion and summary. Removal of *Balanus* (now *Semibalanus*) strongly improved *Chthamalus* survival; cages and transplants distinguish predation and immersion. Connell describes heat and/or desiccation as the likely upper-limit explanation, and discusses settlement and indirect predator effects. The visualization's curves remain schematic.
- [Hutchinson (1957), Concluding Remarks, complete original in a collected-papers scan](https://people.uncw.edu/borretts/courses/BIO602/Hutchinson%201957%20Concluding%20Remarks.pdf): the complete relevant niche formalization and limitations, original pp. 416–418, read. The niche consists of conditions permitting indefinite persistence, not a map of geographic occupancy; interactions with the focal competitors are varied against a fixed community background.
- [Gause (1934), The Struggle for Existence, full book transcription](https://sites.science.oregonstate.edu/~deleenhp/teaching/fall15/MTH427/Gause-The-Struggle-for-Existence.pdf): complete relevant Chapter V §§II–III on the *aurelia*/*caudatum* protocols, monoculture fits, competition and coefficient changes. The text specifies daily medium replacement, 0.5-cm³ samples from 5-cm³ cultures, volume conversion between differently sized species, and early facilitation. A constant-coefficient reconstruction is a simplification. The separate *caudatum*/*bursaria* account has not been traced to its original report.
- [Tilman (1994), Ecology 75, pp. 2–16, full original scan](https://users.wfu.edu/silmanmr/bio377/assignments/Readings/tilman1994.pdf): complete relevant two-species derivation and assumptions, pp. 4–7, including equations (3)–(4), equal-mortality condition, and discussion of Nee–May habitat destruction. The displayed destruction model is checked algebraically, but this paper is secondary evidence about the earlier historical sources and their priority.

Temporary PDFs/text are in `/tmp/ecol-primary`. Tilman 1980's publisher PDF returned HTTP 403; the Chesson 1981 author-reprint link returned HTTP 503; the Grant 2006 CiteSeer full-paper request returned HTTP 503. Abstracts and previews were not treated as full original-paper readings.

## Corrections and outcomes

| Item | Outcome |
| --- | --- |
| ecol-4.1 | Closed. Primary field experiment and niche formulation checked. Restricted the shrinking-niche claim to the negative-interaction model; removal of one competitor tests its contribution rather than revealing every boundary of the fundamental niche. Retained the original paper's qualification about upper limits. Both themes exercise competition removal and the strength slider. |
| ecol-4.2 | Retained. Original Gause text contradicts a simple claim that fixed coefficients inferred from monocultures predicted every mixed-culture phase. The item now reports his coefficient changes and early facilitation explicitly, and calls the fixed positive coefficients illustrative. The second species-pair history remains open. |
| ecol-4.4 | Retained. Corrected the equal-consumption-ratio edge case: an aligned supply ray can support a neutral family of positive mixtures. Added an explicit readout for this degeneracy. Corrected the reversed-consumption explanation: suppressing the rival more than oneself produces positive feedback. An exactly symmetric start can stay at an unstable equilibrium rather than approaching 0 or 1. |
| ecol-4.7 | Retained. Complete public1967 body/captions now read; unequal fixed-K comparisons are primary-supported. Original figure/equation scans remain missing, as does the complete1972 PNAS environmental-variability paper. Fixed between-species variation is explicitly distinguished from temporal noise. See ecol-4-7-source-followup.md. |
| ecol-4.8 | Retained. Symmetric equal-capacity competition now evaluates N=K/(1+α) directly; the old difference quotient produced 0/0 when coinciding traits made α round to 1. Corrected the claim that wider competition always gives stronger displacement; the implemented symmetric gradient permits divergence when competition is narrower than resource availability. |
| ecol-4.10 | Retained. Zero invasion rates are a neutral/boundary case rather than automatic exclusion. Degenerate expectations are evaluated analytically; Gaussian quadrature now spans ±8 standard deviations and agrees with an independent fine integral. The scope says approximation, not an exact integral. Added 0<δ and the first-order δΔμ term to the small-fluctuation interpretation. |
| ecol-4.12 | Retained. Equilibria satisfy the equations and habitat bounds. Simulations now start within the available habitat even at 99% destruction. The readout explicitly identifies controls that break the required competition–colonization trade-off, and no longer relies on an undefined c2 field. |

## Remaining source evidence

| Item | Evidence needed before closure |
| --- | --- |
| ecol-4.2 | Original *caudatum*/*bursaria* experimental report, including the specific food/vertical-zone explanation. The accessible 1934 Chapter V establishes the *aurelia*/*caudatum* account, not that separate claim. |
| ecol-4.4 | Complete Tilman 1980/1982 resource-competition derivation and its exact stability assumptions. The corrected degenerate case is independently demonstrated, but that does not certify the full historical attribution. |
| ecol-4.7 | Intact MacArthur–Levins1967 original equation/figure scans and the complete May–MacArthur1972 PNAS body/methods/figures. The complete public1967 text/captions have now been read, including unequal fixed-K comparisons. |
| ecol-4.8 | Complete Brown–Wilson, Slatkin, Schluter–Price–Grant and Grant–Grant originals for the term, particular gradient-model attribution, competing explanations and both finch examples. The illustrative symmetric model does not establish any field mechanism. |
| ecol-4.10 | Complete Chesson–Warner 1981 paper and conditions for protected coexistence in its original model. The modern equal-mortality/lognormal specialization is independently checked, not the whole historical paper. |
| ecol-4.11 | Complete Janzen 1970/Connell 1971 originals plus primary empirical evidence supporting the retained 'well documented' sentence. The toy forest and enemy kernel are not measurements or an estimate of the contribution to tropical diversity. |
| ecol-4.12 | Complete Levins–Culver 1971, Hastings 1980 and Nee–May 1992 originals for the combined credit and habitat-destruction extension. Tilman 1994 supports the mathematics and explicitly reports the earlier work, but cannot replace each historical original. |

## Checks

- `node tests/verification-ecol-source.test.mjs`: seven groups pass, including a fine independent normal integral, exact degenerate cases, positive neutral resource equilibria, stable versus priority-effect trajectories, equilibrium residuals/habitat bounds, and analytic logistic monocultures.
- `node tests/verification-ecol-source-browser.mjs`: seven changed items, both themes, real pinned KaTeX, native controls and pointer drag. Checks include neutral consumption/lottery cases, coinciding traits, and broken colonization trade-off. Screenshots/results: `/tmp/ecol-source-verification-shots/`, `/tmp/ecol-source-verification-browser.json`.
- `node scripts/check.mjs ecol --static --fail-on-warnings`: 49 items, zero errors and warnings.

## Cross-field peer follow-up

The separately authorized known mathematical/scope corrections are documented in [peer-corrections.md](peer-corrections.md), with independent math and both-theme native evidence. This follow-up does not close any source flag.

## Exact-original limiting-similarity follow-up

The complete public MacArthur–Levins1967 text and figure captions were read from the supplied Scribd page; the original diagrams and several equations remain unavailable/damaged there. The correct May–MacArthur1972 source is PNAS69(5):1109–1113, doi:10.1073/pnas.69.5.1109. Official article/PDF attempts did not yield a readable full paper. The flag remains open with its narrower gap; scope and references now distinguish fixed carrying-capacity variation from temporal environmental variability. See [the exact-source report](ecol-4-7-source-followup.md).
