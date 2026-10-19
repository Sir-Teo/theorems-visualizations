# Pharmacology redistribution source audit

Resolved: **pharm-3.4**. Independent parent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Original primary paper actually read

Mark, Burns, Campomanes, Ngai, Trousof, Papper and Brodie (1957), **The Passage of Thiopental into Brain**, *J Pharmacol Exp Ther* **119**(1):35–38, [PMID 13417057](https://pubmed.ncbi.nlm.nih.gov/13417057/). Read the complete four-page original paper, including Methods, serial-biopsy Results, Tables I–II, Discussion and Summary, from the [original-paper PDF mirror](https://citeseerx.ist.psu.edu/document?doi=73b9a1a52d2fa4b3172ec0bf5399836f496cf2ef&repid=rep1&type=pdf). Rendered and inspected original pages 36 and 37 to verify the tables and surrounding results.

The experiments were in dogs. Serial biopsies showed rapid brain entry and declining brain/plasma concentrations; the separate 30-second samples supported rapid entry. Human EEG comments in the Discussion were personal communications and are not presented as an independently verified human trial. The paper does not validate the example's assumed effect-site delay, volumes, clearances, threshold or second-dose predictions. The old 1952/1960 references were not reread and are no longer used to support this item's quantitative claims. The displayed redistribution example is independently verified mathematical mass balance, distinguished from the measured rapid-brain-entry observation.

Local PDF `/tmp/atlas-pharm-mark1957.pdf`, SHA-256 `7e3cd6f413b3a35993c8dac8b9c23ed3f853162908a285512bc8d109441f1698`; inspected `/tmp/atlas-pharm-mark1957-page{2,3}.png`.

## Corrections and evidence

The former text called a freely chosen effect-site crossing a patient's waking time and suggested all parameters matched human thiopental measurements. It now labels the model, parameters, massless proxy and threshold explicitly. Central mass no longer includes a fictitious brain amount. The full 120-minute concentration trace now fits, including its previously clipped initial plasma peak and second bolus. The simulation retains both sides of the bolus jump, stops exactly at 120 minutes, and reports every downward crossing, including the second episode the old first-crossing readout missed. Mass at crossings is interpolated consistently using the actual cumulative dose.

- `node --test tests/verification-pharm-redistribution.test.mjs`: **3 groups pass**. All 16 switch configurations against an independent positive matrix-exponential series; positivity and mass balance at every sample; exact second-dose jump with continuous effect-site concentration; independent analytic no-exchange/no-clearance limit; zero-clearance redistribution crossing; both second-dose crossings, independently bracketed exponential roots within 0.002 minute and mass conservation at interpolated crossings.
- `node tests/verification-pharm-redistribution.mjs`: **2 native light/dark groups pass**. All 16 actual toggle configurations and both actual threshold endpoints per theme; every-point mass balance; all full concentration curves and stack polygons inside the axes; a separate actual 0.3 reference interaction verifies both post-bolus downward crossings. No page/math errors or invalid readouts.
- Inspected full-size light two-crossing screenshot and dark extreme screenshot: `/tmp/atlas-pharm-redistribution-3.4-{two-crossings,all-Home,all-End}-{light,dark}.png`.
