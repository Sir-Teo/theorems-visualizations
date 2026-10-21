# Population-genetics source review B1 — Kimura 1968

**popgen-3.14 is ready for central integration; its `verify: true` flag remains set.** This is a full named-original review, separate from the selection A5 batch. The Wave 5 gate remains unchanged.

## Original source actually read

Motoo Kimura, [Evolutionary Rate at the Molecular Level, Nature 217 (1968), 624–626](https://www.blackwellpublishing.com/ridley/classictexts/kimura.pdf). Full three-page original reproduction, SHA256 `810f8d2b67a273c43f900450bdf790d67ed6aa2273a7c31539f25784ede022ae`. The [publisher’s host page](https://www.blackwellpublishing.com/ridley/classictexts/kimura.asp) explicitly identifies permission from Macmillan Magazines Ltd. All three scan pages were visually read, including the equations, conclusion and references. Physical pages 1–3 correspond to original 624–626; the reproduction’s first page lacks its printed 624 header. A separate full IAS-hosted original copy was also acquired (SHA256 `1ff8180bb00ae6f215a9036a9a98ec7676a1e306d21eab73e19bbee5fb6fbbf9`) but its imperfect extracted text was not trusted for mathematical signs.

Printed p.625 explicitly gives the average protein rate, 300 nucleotide pairs per 100 residues, the 1.2 synonymous-change factor, haploid complement 4 billion pairs and resulting approximately 1.8-year interval (rounded to two years in the prose). It gives the historical Haldane budget .1/30 and the four-year-generation assumption, and distinguishes nearly neutral load in Eqs.(1′)–(2′). Page626 explicitly warns that per-generation nucleotide mutation rates differ between man and Drosophila, discusses heterozygosity and ends with the drift conclusion. The retained statement reports the original’s argument and its assumptions rather than claiming its extrapolation measures all modern mammalian genomes. The detailed selected-mutation load formula is not implemented or rederived.

## Corrections

The old rate `1.2e−10` omitted the paper’s actual conversion. Default rate is now `1.2/(28e6*300)`, yielding **one substitution every1.75 years** for its chosen genome. Default generation time is **four years**, not two. Exact unrounded reconstruction gives 16/7 per generation; the original rounds its yearly estimate before giving roughly two per gamete per generation.

The left axis now compares only substitution rates. Its former dimensionless ratio bar was incompatible with that axis, and the ratio is now a readout. Both views include all actual finite values across the full controls. The right curve has no artificial load floor, and its fraction can appear below1e−4. When the additive budget is nonbinding, its marked point is on the actual cost curve at a=1 below the budget rather than falsely placed on the budget line. Small allowed fractions retain scientific notation instead of rounding to0%. Original nearly neutral changes are distinguished from exactly zero-cost neutral changes.

The adjustable `a k D` accounting is explicitly a reconstruction conditional on additive costs, not a universal limit or a measurement of adaptive substitutions. Unsupported modern generalizations and the former assertion that the original had not been accessible are removed.

## Verification

- `node --test tests/verification-popgen-kimura.test.mjs`: **3/3 independent math groups passed**, independently deriving the residue/triplet/genome conversion and historical default, all32 parameter corners, the binding/nonbinding inequalities and true curve-point placement, and finite plot ranges without floors.
- `node tests/verification-popgen-kimura.mjs`: **2/2 actual light/dark groups passed**, original defaults, all32 actual input corners, independent two-bar count, a nonbinding budget and an allowed fraction below1e−4. Runtime/KaTeX and finite path/dot extents pass. Final scientific-percent formatting was rerun.
- `node scripts/check.mjs popgen-3.14 --static`: **one item,0errors,0warnings**. All seven chapter dependency arrays and all other chapter entries preserved; no existing shared helper or central file changed. Whitespace clean.
- Screenshots: `/tmp/atlas-popgen-kimura-{nonbinding,extreme}-{light,dark}.png`; inspected the final extreme light layout. Finite arithmetic and browser checks do not establish empirical support for the historical genome extrapolation or additive-cost assumption.

Scoped helper: `content/popgen/source-audit-kimura.shared.js`.
