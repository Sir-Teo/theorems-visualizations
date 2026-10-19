# Systems biology lambda decision illustration

Ready for integration: **sysbio-4.6**, `content/sysbio/ch04-b.js`. Source flag retained. New scoped lambda helper/math/browser scripts; existing shared helper unchanged.

## Primary evidence read

- [Mark Ptashne, Lambda’s Switch: Lessons from a Module Swap](https://people.bu.edu/mfk/ptashne.pdf), Current Biology16 (2006),R459–R462, DOI10.1016/j.cub.2006.05.037. Complete author review acquired and read, including Figure1 and all captions. `/tmp/atlas-sysbio-ptashne2006.pdf`/`.txt`; SHA256 `1631cff592ca1bb2c9c5edf7d70f5f588ae1a3033cc8d34eb338d88ef25464f3`. R459–R460 establish CI activation/negative autoregulation, Cro early-gene/CII regulation and promoter logic; R461 distinguishes Cro direct repression’s contribution from an indispensable simple-toggle mechanism. Original Figure1 inspected `/tmp/atlas-sysbio-ptashne-original.png`. This is the author’s full review, not a claim that the referenced book/1981 paper were acquired.
- [Zeng, Skinner, Zong, Sippy, Feiss & Golding, Decision Making at a Subcellular Level Determines the Outcome of Bacteriophage Infection](https://bacteriophysics.web.illinois.edu/wp/wp-content/uploads/2019/02/zeng-cell-2010.pdf), original Cell141 (2010),682–691, DOI10.1016/j.cell.2010.03.034. Full ten-page original author-lab PDF acquired; Results, Discussion, Methods and figure captions read. `/tmp/atlas-sysbio-zeng2010.pdf`/`.txt`; SHA256 `4d7a5aafdc76eaee187f07cca4381ca76e6b9d1ab0ff79541fed1874ca32e075`. pp683–685/Figure2 establishes multiplicity/cell-size dependence and distinguishes failed/no-growth outcomes; pp685–687/Figure3 provides the single-phage unanimous-vote fit and dnaJ host exception; pp688–690 discuss interpretation and assay. Figure3 personally inspected `/tmp/atlas-sysbio-zeng-original.png`.

Removed unnecessary unverified Kourilsky priority attribution and the original statement’s unsupported claim that infection multiplicity and DNA-damage induction follow solely from mutual repression. CI negative autoregulation and Cro’s indirect CII regulation are acknowledged. The host-specific single-virus result is not made universal.

## Model and display corrections

The exact chosen three-variable equations and constants are now stated. Multiplicity scales only CII production and remains sustained; this is an atlas simplification, not genome-copy kinetics or the original voting model. Cohort variability is fixed parameter heterogeneity, not chemical reaction noise. Both source biology and concentration/time units are separately scoped.

Infection colors/bars explicitly classify CI> Cro at finite time60, rather than claiming actual lysis or lysogen formation. The24 drawn paths and60-member fractions now use the same numerical step. Infection axes expand to include all drawn paths, including strong establishment/high multiplicity. UV mode is an added CI removal rate in model units, not a calibrated physical dose. Every sampled rate starts at the same20-unit relaxed initial state used in the time trace. The old “critical dose”/saddle-node claim inferred from80-unit endpoints is replaced by the first sampled rate with Cro>CI at time100, grid spacing0.075; it is explicitly a finite-time criterion, not proof of a bifurcation.

## Validation

`node --test tests/verification-sysbio-source-audit-lambda.test.mjs`: **4 groups pass**. Independent simultaneous midpoint integration in separately written algebraic form across8 infection extremes; positive orthant/model-dependence checks; shared pre-relaxed induction initial state/exact event timing against independent integration; endpoint-grid bracketing and step refinement. These checks validate the chosen illustration, not a quantitative biological mechanism.

`node tests/verification-sysbio-source-audit-lambda.mjs`: **2 light/dark groups pass**. Actual8 infection corners ×60members at8multiplicities per theme; every point of24drawn paths, all cohort fractions, endpoint colors/views,4actual induction rates and all41sampled dose-curve endpoints checked. No page/TeX errors or NaN readouts. Personally inspected:

- `/tmp/atlas-sysbio-lambda-strong-cohort-all-paths-visible-light.png`
- `/tmp/atlas-sysbio-lambda-induction-finite-time-scope-dark.png`

No empirical infection probabilities, physical UV calibration or Wave5 work are asserted. Central ledgers unchanged.
