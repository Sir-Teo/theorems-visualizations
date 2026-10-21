# Independent review — Wave 5 Statistical Inference chapter 9

Reviewer: author_fluid; review date 2026-10-21. Scope: all thirteen stat-9.1 through stat-9.13 items in ch09.js/ch09-b.js, shared numerics, author verification and tests. Review changes are confined to this report; requested content/source corrections went directly to author_ml.

## Finding

No unresolved mathematical or computational defect found. A source-section metadata mismatch was found and corrected by the author: the linked current CMU Lecture 20 places parametric bootstrap in §4, bootstrap consistency in §6, and maximum failure in §7. Item 9.8/evidence now cite §6; item 9.6 adds §4; item 9.9 links the actual CMU §7 maximum example rather than the generic NIST bootstrap plot page.

## Independent source verification

- [Wasserman, current 36-705 Lecture 20](https://www.stat.cmu.edu/~larry/=stat705/Lecture20.pdf): read actual §§1–3, §4, §6 theorem/proof, Figure 1 and §7. The artifact correctly separates population substitution from finite-B conditional simulation. Its smooth theorem claims consistency without the source's stronger third-moment rate; a finite-variance bootstrap CLT plus ordinary/conditional delta method supplies the stated continuously differentiable mean-transform subclass. The nonzero derivative and continuous limit justify the sup-CDF formulation. The maximum atom, sign and exact finite-n Uniform pivot are correct.
- [Shalizi, 36-402 bootstrap notes](https://www.stat.cmu.edu/~cshalizi/402/lectures/08-bootstrap/lecture-08.pdf), §2.3.1: independently checked studentized root with replicate-specific standard error and reversed quantile endpoints. The implementation uses the analytic mean SE in each replicate rather than an unnecessary inner bootstrap, and explicitly counts zero-SE exclusions.
- [Efron and Narasimhan, author-hosted paper](https://efron.ckirby.su.domains/papers/2018Automatic-Construction-BCIs.pdf), §2: independently checked BCa transformation and both occurrences of bias correction z0. The PMC URL presented a CAPTCHA to this reviewer; the author-hosted copy supplies the primary-source fallback. The chapter does not claim that coarse B=399 adjusted tails deliver automatic second-order coverage for median/tied data.
- [Efron (1979), university-hosted original scan](https://blogs.helsinki.fi/bk-club/files/2012/05/Efron_Bootstrap_AS1979.pdf): original article metadata independently retrieved; the available text extraction covers only the scan cover, so this reviewer does not claim to have independently transcribed the scanned median passage. The author evidence records its visual inspection. The new five-point exact-enumeration example is explicitly synthetic, not attributed to Efron's dataset. Resampling with replacement is distinguished from permutations and from delete-one jackknife perturbations.
- [Künsch author's publication list](https://people.math.ethz.ch/~kuensch/papers/) confirms the 1989 original and volume/pages. The author-uploaded original abstract states the block-growth and block/n conditions; the chapter labels its circular-block variant. The AR(1) variance formula is independently derivable from stationary covariance and does not rely on an unsupported generic block-length claim.
- The Athreya original publisher full-text URL remained inaccessible in this reviewer environment. The artifact's restricted Pareto alpha in (1,2) inconsistency claim matches the known stable-attraction result and the author's documented cross-check; this review does not claim to have read that inaccessible original proof. The finite simulation is correctly described as illustrative, not proof, and no universal infinite-variance-statistic or universal bootstrap repair claim is made.

## Independent calculations beyond author tests

Author's `node --test tests/wave5-stat.test.mjs` was rerun: 9/9 pass. Additional independent Python calculations were run from a temporary reviewer script, avoiding repository-content changes:

1. Exact 5^5 ordered resample laws for three distinct skewed datasets, with Python standard-library NormalDist CDF/inverse and independently coded jackknife acceleration and linearly interpolated quantiles. BCa endpoints agreed exactly at these discrete laws; adjusted-tail probability maximum error was 5.55075098801483e-8, consistent with the browser's documented normal-CDF approximation.
2. Integer gamma CDFs were independently obtained by adaptive integration of exp((n−1)log x−x−lgamma(n)), rather than duplicating the implementation's finite Poisson sum. Across n=8,16,32,64,128 and standardized offsets −5,−3,−1,0,1,3,5 (35 states), maximum absolute CDF discrepancy was 5.1559867486616895e-12.
3. Circular-block conditional mean variance was independently enumerated over 16 ordered pairs of block starts for data [1,4,−2,8] and block length 2. Exact variance 0.78125 equals population variance of circular block sums divided by k*l². This checks the implemented resampling interpretation rather than repeating the authored stationary covariance sum test.
4. Manual derivation checks: Pareto alpha=3 variance is 3/[(3−1)^2(3−2)]=3/4, geometric mean3 variance12, fitted-Poisson conditional mean SE sqrt(mean/n), mean jackknife SE equals sample-SD/sqrt(n), and exponential/log-mean root CDF transformations are dimensionally and algebraically correct.

## Browser and visual review

Independent scoped browser run: `node scripts/check.mjs stat-9.4 stat-9.8 stat-9.11 stat-9.13 --dark --w=350 --modes --still --jobs=2` — 4/4 pass, zero runtime failures, TeX/blank warnings or quality warnings. This specifically exercises BCa/statistic modes, smooth-transform consistency modes, dependence and the editable exact-law item. Root is responsible for the shared native matrix.

Personally inspected final native screenshots for all thirteen items: narrow dark 9.1–9.4 and 9.9–9.13, desktop light 9.5–9.8; also checked representative opposite-theme/width captures. Files follow `/tmp/wave5-stat-9.N-{light,dark}-{860,350}.png`. Probability/density normalization, readable exterior axes, disclosed finite-simulation uncertainty, correct maximum-atom jump and preserved off-screen CDF mass all appear coherent. The 9.13 exact probability plot includes Monte Carlo spikes in its vertical bounds and its draggable largest-point label stays inside the canvas.

Review acceptance: content and mathematics accepted after the source-reference fixes above. Shared native matrix remains root's gate. No review authorization is inferred for commits or release.
