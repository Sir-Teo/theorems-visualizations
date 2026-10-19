# Bioinformatics source review — 18 October 2026

Closes all three existing source flags: bioinf-3.9, bioinf-4.1 and bioinf-4.5. This review addresses these items, not an original-source audit of every unflagged item in the collection.

## Evidence read

- [Altschul et al. (1990), complete original BLAST manuscript represented in HTML](https://blastalgorithm.com/), J Mol Biol 215:403–410, doi:10.1016/S0022-2836(05)80360-2. Read the complete relevant introduction, Methods §2(a–c), Results §3(a–d) and conclusion, including Eq. (1), the expected work expression in §3(b), and the explicit FASTP comparison in §3(c). This is a full manuscript representation with tables and figures, rather than a claim to have read the publisher's original page scan. Visually inspected Fig. 2's CPU-time versus word-list-size plot. The original's protein examples use PAM120 and later analyses w=4/T=17; they are distinct from the BLOSUM62 classroom benchmark.
- [Altschul et al. (1997), complete fourteen-page original](https://europepmc.org/articles/PMC146917?pdf=render), Nucleic Acids Res 25:3389–3402, doi:10.1093/nar/25.17.3389. Read the full relevant introduction, statistical preliminaries and two-hit section, pp. 3389–3391; visually checked Fig. 1–2 and their captions on p. 3391. The overall approximate threefold speed claim combines two-hit and gapped-alignment refinements; the isolated hit-processing comparison in this section is approximately twofold. Unrelated PSI-BLAST sections are not claimed as read.
- [Durbin, Eddy, Krogh & Mitchison (1998), Biological Sequence Analysis, complete book scan](https://www.lix.polytechnique.fr/~ponty/docs/Durbin-Eddy-Krogh-Mitchison-Book-1998.pdf). Read complete §3.1, pp. 47–51, and relevant §3.2 model definition, all three casino examples, Viterbi/forward/backward recursions and posterior-decoding discussion, pp. 52–60. Visually checked the transition tables p. 50, casino graph p. 54 and decoding example p. 57. The textbook itself is the primary source for these specific teaching models; this does not claim a full reading of Gardiner-Garden–Frommer 1987.

Downloaded evidence and OCR are under `/tmp/bioinf-primary`.

## Corrections and outcomes

| Item | Outcome |
| --- | --- |
| bioinf-3.9 | Closed. Corrected the expected chance-match count E versus the Poisson probability 1−exp(−E). Added original parameter and FASTP-comparator provenance. Qualified the work counter: search lookups/hits/extension cells exclude neighbourhood construction, and equal unit costs are not CPU timings. Removed the readout's unsupported comparison of this operation ratio with the original published speed ratio. |
| bioinf-4.1 | Closed. Checked all 32 transition-table entries against the book. Confirmed 48 putative islands and almost 60,000 nucleotides overall, replacing recollection. Explained normalization of the one rounded row summing to 1.001 and the simulated uniform first base. Corrected sixteen entries versus twelve free parameters. |
| bioinf-4.5 | Closed. Checked all emission/switching defaults against the original example. Disclosed stationary initialization and independently simulated rolls. Removed guarantees of high decoding accuracy, monotonic finite-sample behavior and necessarily worse accuracy after estimation; the original itself shows misleading chance sequences. |

## Validation

- `node tests/verification-bioinf-source.test.mjs`: five passing groups. Independently checks the source matrices and direct counts; casino stationarity/run lengths; all 128 hidden paths for nine parameter settings against Viterbi, forward and posterior calculations; enumerated scored words and brute-force ungapped best-segment scores; and E-values versus bounded Poisson probabilities.
- `node scripts/check.mjs bioinf --static`: 47 items, zero errors or warnings.
- `node tests/verification-bioinf-source-browser.mjs`: real Chromium, serial light/dark controls, pinned KaTeX installed through `installBrowserAssets`. Exercises both word lengths, two-hit and extreme thresholds; both CpG models/log-odds and training extremes; and casino bias/switching/resampling controls. Final result is recorded in `/tmp/bioinf-source-verification-browser.json`; screenshots are in `/tmp/bioinf-source-verification-shots/`.
