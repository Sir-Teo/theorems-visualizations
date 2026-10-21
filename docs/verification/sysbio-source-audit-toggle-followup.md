# Systems biology original toggle-switch paper

Ready for integration: **sysbio-4.10**, `content/sysbio/ch04-b.js`. Source flag retained. New helper/math/browser files use `sysbio-source-audit-toggle`; existing ch04.shared.js unchanged. The new equilibrium isolation is consumed only by the reviewed4.10 entry.

## Original full paper acquired/read

Gardner, Cantor & Collins, [Construction of a genetic toggle switch in Escherichia coli](https://bioinformatics.cs.vt.edu/~murali/teaching/2003-fall-cs6104/papers/designer/gardner-nature-vol403-genetic-toggle.pdf), Nature403 (2000),339–342, DOI10.1038/35002131. The Virginia Tech course index linked this original four-page academic mirror. `/tmp/atlas-sysbio-gardner2000-original.pdf` and `.txt`; SHA256 `936bb96f7ca8de9efdfa4e27628e4f7db67374a740025df035cba5c873d2c9a9`. Printed=PDF+338. All four pages, Box1, Methods and six figure captions read. Original Figures4–5 personally inspected `/tmp/atlas-sysbio-gardner-original-fig45.png`; rendering confirms the μM unit which text extraction can misread as mM. No numerical concentrations from that OCR ambiguity were copied into product.

Box1 p339 gives the two ODEs, nullcline geometry and qualitative cooperativity/balance condition; Figure2/p340 maps design conditions; p340/Figure3 distinguishes pTAK LacI/CIts with IPTG/thermal induction from pIKE LacI/TetR with IPTG/aTc. Five of six constructed toggles were bistable, not every wiring/strength choice. Figure4/p341 supports finite memory, including22 hours after inducer removal; Figure5/p341 shows a noisy rather than perfectly discontinuous threshold and supplies alpha1=156.25, alpha2=15.6, beta2.5, gamma1 plus separate IPTG binding law. Figure6/p342 shows asymmetric switching times; Methods specifies JM2.300, plasmids, growth and GFPmut3 flow cytometry.

The author-uploaded full original text on ResearchGate was also read, but its PDF link returned404 and Nature’s PDF request returned HTML. Closure uses the successfully acquired complete original VT PDF, not metadata or that failed download.

## Corrections

Removed recollection-only scope and false claim that original parameter values were unavailable. Identified the actual construct classes, controls and finite memory. The displayed symmetric default,11-fold repressor rescaling,20-unit pulse and40-unit recovery remain explicit chosen illustration. The original Figure5 fit is identified but not claimed reproduced. The sharper necessary beta×gamma>1 loop-gain bound is derived here and linked4.3; it is not presented as a verbatim condition printed in Box1 or sufficient for bistability.

Replaced this consumer’s finite sign-grid root count with analytic monotonicity partitions. For G(v)=a2/[1+(a1/(1+v^b))^g], dlog(G/v)/dlog(v)=gain−1. In w=v^b, the gain is unimodal; its maximum solves (gw−1)(1+w)^g=a1^g, a strictly increasing equation for w>1/g. Thus gain=1 partitions the domain into monotone G/v intervals and isolates up to three roots, including tangent folds. Marginal roots are separately labeled and do not count as strictly stable. Design-map coloring remains a finite raster, not an exact continuous boundary.

Changing any parameter now resets the gold point to a current-model equilibrium; previously an old state could remain stale/outside the new dynamics. Both pulse buttons use explicitly staged constant-input integration, report the finite endpoint’s uninduced ODE residual, and can fail to switch outside suitable regimes. The caption no longer guarantees every pulse flips/retains the state.

## Checks

`node --test tests/verification-sysbio-source-audit-toggle.test.mjs`: **5 groups passed**: exact symmetric n2 algebraic states/eigenvalues and critical degeneracy; independently constructed nonsymmetric fold and nearby root pair;144 strength/exponent combinations and independent Jacobian/product bound; degree5 polynomial isolation at6 unequal-strength cases; independently written midpoint pulse integration at8 regimes/directions and default successful reversals.

`node tests/verification-sysbio-source-audit-toggle.mjs`: **2 native light/dark groups passed**: both real pulse buttons and every trail point/endpoint;8 actual strength/exponent regimes and every equilibrium dot;7 raster probes per regime; stale-state clearing after parameters; actual logarithmic design-handle drag and Reset. No page/TeX errors. Personally inspected:

- `/tmp/atlas-sysbio-toggle-both-pulses-and-memory-light.png`
- `/tmp/atlas-sysbio-toggle-drag-and-current-equilibrium-reset-dark.png`

Subsequent spacing-only prose edits in lambda/toggle change no calculations. No infinite biological memory, original-data fit or Wave5 advancement.
