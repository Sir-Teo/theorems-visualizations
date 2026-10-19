# PMA source review — 18 October 2026

The complete third-edition scan of Rudin's *Principles of Mathematical Analysis*
was downloaded from [this full-book mirror](https://david92jackson.neocities.org/images/Principles_of_Mathematical_Analysis-Rudin.pdf).
Its SHA256 is `bbb03fa01ba626ffffbebcfc00d94c4f1eac3ad13cda3e8c145c50bac2c201f5`.
The scan has 351 PDF pages; printed page numbers are nine less than PDF page numbers.
Relevant complete pages were rendered and read using serial OCR, with the scan
used to resolve notation. Temporary evidence is under `/tmp/atlas-rudin/`.

All 22 source flags are closed. Each item now has its exact source
locator. Item kinds normalize the source's remarks/constructions to the site's
schema; an appended letter identifies a corollary, not a separately numbered
book theorem.

| Item | Inspected location |
| --- | --- |
| 1.26 | Theorem 1.26, p. 13 |
| 1.29 | Theorem 1.29, p. 14 |
| 2.29 | Remark 2.29, pp. 35–36 |
| 2.44 | Cantor-set construction, pp. 41–42 |
| 3.37 | Theorem 3.37 and proof, pp. 68–69 |
| 3.44 | Theorem 3.44 and proof, p. 71 |
| 3.51 | Theorem 3.51, p. 75; proof deferred to 8.2 |
| 5.16 | Remarks 5.16, pp. 111–112 |
| 6.16 | Theorem 6.16 and proof, p. 130 |
| 8.13 | Section 8.13, pp. 188–189 |
| 8.21 | Consequences of the beta integral, p. 194 |
| 9.9 | Section 9.9, pp. 210–211 |
| 9.25 | Theorem 9.25, p. 223 |
| 9.41a | Corollary to 9.41, p. 236 |
| 10.13 | Section 10.13, p. 256 |
| 10.16 | Section 10.16, pp. 258–259 |
| 10.25 | Theorem 10.25 and proof, pp. 265–266 |
| 10.43 | Theorem 10.43 and proof, pp. 281–282 |
| 11.7 | Definition 11.7, p. 304 |
| 11.24a | Theorem/corollary 11.24 and Remarks 11.25, pp. 315–317 |
| 11.40 | Theorem 11.40, p. 328 |
| 11.40a | Corollary to 11.40, p. 328 |

The null-set corollary had omitted measurability/integral-existence conditions.
Its statement now gives the nonnegative or integrable hypotheses, explicitly
requires both sets measurable, and qualifies the almost-everywhere consequence.
Its proof treats signed functions through their positive and negative parts.

The Dirichlet-kernel statement now specifies the removable values at multiples
of 2π. Historical dates have separate, explicitly secondary support: the full
[Cantor-set historical discussion and references](https://en.wikipedia.org/wiki/Cantor_set#Historical_remarks)
identifies Cantor's 1883 mention and earlier work, so the credit now says
“Discussed by Cantor” rather than implying priority; the full
[Abel-theorem article and original-paper citation](https://en.wikipedia.org/wiki/Abel%27s_theorem)
supports the 1826 power-series method used for 3.51; and Øystein Ore's
[complete scientific biography of Dirichlet](https://mathshistory.st-andrews.ac.uk/DSB/Dirichlet.pdf),
p. 3, explicitly dates the partial-sum-integral method to 1829. These are not
claims to have read Cantor's or Abel's original historical papers.

This ledger records source verification; it does not claim a human review of the
PMA diagrams. Full browser sweeps and the independent human sample are separate gates.
