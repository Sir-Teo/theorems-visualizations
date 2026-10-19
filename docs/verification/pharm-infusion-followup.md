# Pharmacology intermittent-infusion source audit

Resolved: **pharm-4.9**. Independent parent mathematical/native checks and screenshot inspection passed; source flag and central ledger are reconciled.

## Original primary analysis actually read

Barza, Ioannidis, Cappelleri and Lau (1996), [**Single or multiple daily doses of aminoglycosides: a meta-analysis**](https://pmc.ncbi.nlm.nih.gov/articles/PMC2350289/), *BMJ* **312**:338–345, DOI **10.1136/bmj.312.7027.338**. Acquired all seven original PMC page scans (printed pp338–344), read the article's complete Methods, Results, Tables 1–2, Figures 1–2, Discussion and references through their end on p344. OCR was checked against original scans, including the pooled-outcome figures and limitations; the separate Smaill commentary beginning on p344 is not used as the source for the analysis. This is the authors' original meta-analysis; underlying trial papers were not independently reread or reanalysed.

The 21-trial analysis mainly concerned patients without existing renal impairment. Clinical-failure heterogeneity and underpowered ototoxicity data limit interpretation; nephrotoxicity estimates differed with fixed/random pooling. These observations are described as aggregate historical evidence, without converting them into model efficacy, MIC targets or individual safety predictions. The unsupported remembered peak/MIC 8–10 target is removed.

Original scans `/tmp/atlas-pharm-barza1996-page{1..7}.png`, ordered concatenation SHA-256 `7ce6d41ddc90a6a9aa5483112a9150580a7acdff5035097bb643b00dfa873658`; complete OCR `/tmp/atlas-pharm-barza1996.txt`. Official image URLs are linked from the PMC full-text page. The model equations and chosen numerical inputs are independently derived, not fitted from this analysis.

## Corrections and evidence

The old “roughly threefold” steady peak claim fails at long half-lives. The exact q24h/q8h ratio is `3*(1-exp(-8k))/(1-exp(-24k))`; the caption/readout now distinguish exact periodic AUC from startup. Solid exact periodic curves accompany faint startup curves, with every infusion end represented so drawn and reported peaks agree. Analytic extrema and MIC crossing times replace sampled estimates. Plot bounds include the whole MIC region at every corner.

- `node --test tests/verification-pharm-infusion.test.mjs`: **3 groups pass**. All 24 dose/half-life/MIC/schedule corners against independent previous-infusion sums and cycle quadrature; exact MIC duration versus 200000 midpoint classifications; exact peak-ratio identity, equal steady AUC but unequal numerically integrated first-day AUC, and explicit infusion-end vertices.
- `node tests/verification-pharm-infusion.mjs`: **2 native light/dark groups pass**. All three actual schedule buttons and all eight true slider corners per schedule/theme; independent exact inputs, AUC and peak checks; complete startup/periodic curves and finite readouts, with no page/math errors.
- Inspected full-size q8h/low/light and q24h/high/dark screenshots: `/tmp/atlas-pharm-infusion-4.9-{0,1,2}-{0,7}-{light,dark}.png`.
