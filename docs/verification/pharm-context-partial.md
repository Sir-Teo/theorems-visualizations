# Pharmacology context-sensitive half-time partial audit

**pharm-3.12 remains open. Do not clear its source-review flag.** The supported text/model corrections and independent tests below can be integrated as a partial checkpoint.

## Evidence and remaining source limitation

Read the complete [original PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/1539843/) of Hughes, Glass and Jacobs (1992), *Context-sensitive half-time in multicompartment pharmacokinetic models for intravenous anesthetic drugs*, *Anesthesiology* **76**(3):334–341, DOI **10.1097/00000542-199203000-00003**. It explicitly specifies an infusion designed to hold plasma concentration constant; the previous text wrongly left this uncertain despite citing the abstract. The bounded study description now limits itself to the abstract's central-compartment simulation, durations and reported ranges, without claiming measured patient recovery.

The full original paper, detailed parameter tables and full Methods remain unread. The [official original PDF](https://pubs.asahq.org/anesthesiology/article-pdf/76/3/334/322974/0000542-199203000-00003.pdf) repeatedly returned HTTP402/HTML, LWW was blocked, and OpenAlex listed only that same PDF. Search-indexed introduction excerpts were seen but are not treated as a full-paper read. An attempted author-revisit mirror also returned404. These attempts do not justify clearing the source-review flag.

The unsupported secondary-handout and clinical-ranking claims are removed. Six curves now explicitly represent chosen drug-like teaching models, with no original parameter reconstruction or range-matching validation. Their plasma-halving quantities are distinguished from effect-site decline and waking. The full-paper limitation remains visible in scope and readout.

## Independent model checks

- `node --test tests/verification-pharm-context.test.mjs`: **3 groups pass**. Six chosen models × both infusion definitions × three contexts are checked against an independent augmented amount-matrix exponential; normalization/positivity/monotonicity, one-compartment context-independent analytic limit, and the decreasing infusion rate required for concentration holding.
- `node tests/verification-pharm-context.mjs`: **2 native light/dark groups pass** after the shared local KaTeX/bootstrap fix. Both actual infusion definitions and both duration endpoints, full curves/markers/bars, finite readouts and explicit source limitation are checked.

Plot bounds now include complete context curves, endpoint dots and all comparison bars. No published parameter values or curve anchors are asserted. Inspected full-size concentration-holding/480-minute/dark and constant-rate/1-minute/light screenshots: `/tmp/atlas-pharm-context-3.12-{0,1}-{Home,End}-{light,dark}.png`.
