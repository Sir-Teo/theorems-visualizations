# Spaced seeds: agent sample finding

`bioinf-3.8` claimed all weight-w seeds have the same expected number
of hits in a fixed-length region. Equal weight gives the same probability
per valid placement. A span-s pattern has max(0,L−s+1) placements,
so its expected count is max(0,L−s+1)pʷ. Linearity does not require
independence between these overlapping hit indicators.

For the default length 64, p = 0.7 and weight 11, the contiguous seed
has mean 54·0.7¹¹ ≈ 1.068 and the span-18 PatternHunter seed has
mean 47·0.7¹¹ ≈ 0.929. Nevertheless their probabilities of at least
one hit are about 0.300 and 0.467: the spaced seed clusters hits less.
The explanation and readout now distinguish these quantities, and the
statement no longer promises improved sensitivity for every spaced seed.
Each probability is separately labelled exact or simulated, including
templates beyond the exact dynamic program's span limit.

The “random seed of same weight” button also failed for edited templates:
it always set two endpoints and could choose only 16 interior bits, so
weight 1 became 2 and weights 19–20 became 18. The helper now preserves
every editable weight from 1 to 20. Weight 1 uses its single required
position; larger weights use enough span for all required bits.

The directly used expectation-linearity result `prob-1.6.1` was read,
added as a prerequisite and mirrored in the syllabus. Its role is the
sum of hit indicators, not a claim that overlapping placements are
independent. The climate prerequisite ledger records this follow-up
separately from its original audit; integrated additions become 775.

Validation: exhaustive enumeration of short alignments independently
checks the dynamic program and expected counts, and a complete set of
binary alignments checks the simulation's means. Generator tests cover
all 20 weights with 100 seeds each. Native template clicks and randomizer
tests at weights 1, 19 and 20 pass in both themes. The default light/dark
captures were inspected and show the exact means, simulated means and
distinct detection probabilities clearly. Existing bioinformatics source
regressions pass. No original-source flag is closed by these corrections.
