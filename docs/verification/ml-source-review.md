# Learning-theory source review

All14 initial source checks are closed. Native range endpoints, segmented options, toggles and pointer drags passed in all28 light/dark groups with pinned real KaTeX. Six additional native light/dark action-button and sample-canvas checks passed (`/tmp/atlas-ml-actions-browser.json`). All 14 light-theme screenshot panels were manually inspected; the diagrams, ERM fits, error histograms and quantization bounds match their captions. Browser evidence: `/tmp/atlas-ml-browser.json` and `/tmp/atlas-ml-browser.log`.

Complete sources read:

- Shalev-Shwartz and Ben-David, *Understanding Machine Learning*(2014), author manuscript mirrored by the University of Szeged: [full PDF](https://www.inf.u-szeged.hu/~turan/ML-Konyv.pdf), SHA256`c446eabd9212e9836a0f489bf537c4e75a15c42cbbd177bc3d405e63de728d13`. The original author URL returned an HTML redirect/landing page in this environment. This manuscript explicitly warns that its page numbers differ from the printed book; all page locators below use this PDF.
- Full§1.1(pp.19–21),§1.3(pp.22–24),§2.1–2.3.1(pp.33–39),§3.2.1(pp.45–47),§3.2.2and Remarks3.1/2(pp.47–49), Corollary4.6and Remark4.1(pp.57–58). The minimum/infimum convention was checked in§1.6,p.29.
- Garcia and Koelling(1966), [complete two-page original](https://link.springer.com/content/pdf/10.3758/BF03342209.pdf), pp.123–124, including all four training procedures and Fig.1. The study used three x-ray or five lithium-chloride reinforced trials, rather than demonstrating the page's previous universal single-trial claim. The claim is replaced by selective cue–consequence association, and the illustration explicitly remains a toy model.
- Skinner(1948), [complete original transcription](https://psychclassics.yorku.ca/Skinner/Pigeon/), pp.168–172. Six of eight birds had clearly defined responses;15seconds was an effective feeding interval. The page no longer presents inferred beliefs as an observation.

Changes:

- The arbitrary-risk definitions use an infimum where an infinite hypothesis class need not attain its minimum. General-loss learnability explicitly returns a member ofH before the following entry introduces improper learning.
- Removed an uninspected Haussler priority annotation. The proper/improper discussion no longer claims that a richer output universally costs additional samples; its toy comparison is described as a particular cell-majority experiment.
- Distribution drift breaks equality of training and test distributions; it need not break independence. A misleading sample does not prove that no learner could happen to succeed.
- Rectangle ERM now groups all points at an equalycoordinate before updating its maximum-weight interval. The prior algorithm could select only part of an inseparable horizontal level. Disc ERM similarly groups equal squared distances, with a consistent squared-radius membership comparison. The disc experiment explicitly restricts centers to its17×17grid.
- The discretization example uses exactly2^bcell midpoints, whose half-cell error bound holds at both domain edges. Above52bits the browser omits the rounding-error measurement; it does not pretend that binary64 distinguishes every midpoint. Grids finer than64×64are omitted. The statistical guarantee compares with the discretized class and does not bound approximation error relative to the original infinite class.

Independent numerical checks:3groups pass. Rectangle ERM is compared with every candidate rectangle on50tied-coordinate samples; disc ERM with all center/radius breakpoints on20tied-distance samples; midpoint quantization is checked at both endpoints and interior points through52bits. Evidence:`tests/verification-ml-source.test.mjs`, `/tmp/atlas-ml-math.log`.

Source hashes: Garcia–Koelling PDF `0c6b362b6b5fbf62dbae26748ba3f8156947f68d9978384f7d9d18457774b0d1`; Skinner transcription HTML `1c7ebb463e2c7085ec51de046813c6a8e57684eee305ce08beb926e88f4e88c6`.
