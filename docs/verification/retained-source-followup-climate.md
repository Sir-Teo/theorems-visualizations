# Bounded retained-source acquisition pass

Date: 18 October 2026. Scope: three retained gaps only. No browser, OCR, common runtime, checker, queue, master-plan or build-output changes.

## Molecular clock: popgen-3.9 closed

The ordinary public Weizmann teaching-library copy supplies the actual complete 70-page Zuckerkandl–Pauling chapter, *Evolutionary Divergence and Convergence in Proteins*, in *Evolving Genes and Proteins* (1965), pp. 97–166:

https://bip.weizmann.ac.il/education/course/evogen/Clocks/Zuckerkandl_1965.pdf

Local original: `/tmp/atlas-retained-new-leads/clock.pdf`. SHA-256: `dba676915c3669d016d18a34d2c725b863de4999cd48793656e866ec7148d4d6`.

Read the entire relevant §III.1–6, printed pp. 137–152 (PDF pp. 41–56). Original Tables VIII and IX (pp. 145–146), p. 150's probability derivation and Fig. 3 (p. 151) were also rendered and visually inspected. Section III.1 presents approximate sequence-distance proportionality and statistical fluctuation; III.3–5 discuss functional constraint, protein-specific rates, the incomplete comparison matrix and exceptions, including the lemur discrepancy. Table IX's pooled hemoglobin mean difference is 22, with an assumed 80-million-year ancestry calibration and a provisional 7-million-year interval per retained substitution. Section III.6 derives an unchanged-site exponential, explicitly ignores back substitutions, and warns that this omission matters increasingly for remote ancestry. Fig. 3 labels its calibration as assumed.

This directly resolves the card's historical protein-comparison/calibration gap. It does not establish that the old calibration is a modern fossil-date estimate or prove an exact Poisson event model from those measurements. The card already separates chosen model event counts from raw finite-sequence differences and already passed independent numerical and native light/dark validation. Added a precise reference, replaced the obsolete open-gap sentence with this calibration qualification, mirrored the source reference in the syllabus, and removed only this resolved flag. No equations, numerical constants, controls or visualization code changed.

## Peppered moth: popgen-4.13 retained, transposon subgap resolved

The Liverpool author repository supplied its complete 20-page accepted manuscript:

https://livrepository.liverpool.ac.uk/3002967/1/saccheri_carbonaria_whole_paper_with_figs.pdf

van’t Hof et al. (2016), *The industrial melanism mutation in British peppered moths is a transposable element*, Nature 534:102–105, doi:10.1038/nature17951. Local original: `/tmp/atlas-retained-new-leads/moth-liverpool.pdf`. SHA-256: `4f38a9458c60046ae2c497c589f95e239cbf4e3eeef32edbde3a03bdb62fd517`.

Read the complete main text and Methods, manuscript pp. 1–7, including candidate exclusion, sequencing, genotyping, haplotype inference and expression methods. Fig. 1 on p. 2 was rendered and visually inspected. A 21,925-nt tandemly repeated insertion in the first intron of cortex was the sole remaining exclusive candidate after 86 other candidate variants were excluded. It occurred in 105 of 110 fully black moths and none of 283 typica; the five exceptions were interpreted as extreme insularia. The insertion's inverted repeats and four-base target-site duplication support its class-II transposon identification. The paper leaves the full molecular expression mechanism unresolved; the maximum-density date of 1819 also has a strongly skewed uncertainty distribution and is not an exact historical observation.

This closes only the transposon-result subgap. The exact Manchester/Caldy anchors and original Cook–Mani–Varley (1986) inference still need complete original population evidence. A new UCSF journal-club PDF route returned HTTP 403; the working author manuscript was used instead. Added its precise reference and narrowed the remaining source-gap sentence; retained `verify: true`. No new datum, transposon claim or model change was added. The existing source report and ledger now state the remaining gap accurately.

## Lambda switch: sysbio-4.6 retained

Targeted new searches for ordinary public author/university-library copies of Little (1984), PNAS 81:1375–1379, and the original CI/Cro promoter work yielded references, abstracts and later discussions, without a new complete biochemical original. No formerly blocked PMC route was repeated. These results cannot close the activated-RecA-facilitated CI autocleavage and precise promoter-architecture claim. Existing toy-model and Zeng infection-decision evidence remain valid within their previously documented scope. No content or flag changed.

## Validation and final state

`node --check content/popgen/ch03-b.js` and `node --check content/popgen/ch04-c.js` passed. `node scripts/check.mjs popgen-3.9 popgen-4.13 --static` passed with two items, zero errors and zero warnings. No numerical or interaction changes required a new browser pass; prior independent model tests and native light/dark evidence are retained in the original source report and machine ledger.

The original bio cohort has 23 closed flags, four reviewed flags with retained source gaps (`neuro-4.8`, `sysbio-4.6`, `popgen-4.13`, `popgen-4.14`), and zero genuinely unreviewed items. The separately retained `geo-3.9` was outside this bounded pass. Content fingerprints needing refresh: popgen-3.9 and popgen-4.13 only; syllabus references also changed. This pass is frozen after these edits.
