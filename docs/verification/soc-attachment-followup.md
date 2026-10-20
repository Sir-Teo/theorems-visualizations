# Sociology 4.9–4.10: finite attachment processes and stationary laws

Status: **resolved after independent source, mathematical, native-input and screenshot checks; both source flags and the central queue are reconciled**. Scope is only these two objects/import, their syllabus rows, one new isolated helper, two tests and this report. Shared chapter helpers, accepted philosophy/demo work, all neighboring objects, central plans/ledgers and generated data are preserved. No Git mutation or build was performed.

## Primary sources actually read

**Barabási and Albert, “Emergence of Scaling in Random Networks,” Science 286 (1999), 509–512.** Actual author-hosted original scan: https://barabasi.com/media/Emergence-Barabasi-1999_gN74Tws.pdf. Retained `/tmp/atlas-soc-barabasi1999.pdf` (4 pages), SHA256 `9a0f48dd108c76375c4a91f48c79e2598beb5a594c018a0681448ed95a8eeab7`; extraction `/tmp/atlas-soc-barabasi1999.txt`, SHA256 `c9cb0e6354bacc90e81f375c244d8ea2dc09e6de60d2bab998c3770ca0a6202d`.

Read the actual p. 511 model and continuum derivation, including distinct earlier targets in their original model, the two particular model variants, the degree/age approximation and continuum coefficient `2m²`. Inspected `/tmp/atlas-soc-barabasi1999-page-3.png` as actual source pixels. This is not a claim of reading every empirical-data section or validating their historical datasets. No original actor/web/grid numbers or universal necessity conclusion is retained in these items.

**Krapivsky, Redner and Leyvraz, “Connectivity of Growing Random Networks,” actual arXiv:cond-mat/0005139v2, 18 September 2000**, later PRL85,4629–4632. Source: https://arxiv.org/abs/cond-mat/0005139v2. Retained `/tmp/atlas-soc-krapivsky2000.pdf` (4 pages), SHA256 `032c8090552c7a60791f399749202b606f64c34fca5c25a53ad25aeda9519d50`; extraction SHA256 `55dc76dc00f286daeb232d0b8abe74af9beb9ec4822ff3552aae342a24e75e93` at the matching `.txt` path.

Read the complete four-page main text: the directed-tree degree convention, normalized rate equation and degree moments; exact linear law; sublinear asymptotics and the special uniform law; explicitly asymptotically linear kernels with tunable exponents; superlinear/gel asymptotics; finite-size difficulty near kernel exponent1; age-dependent distributions and their breadth. Inspected actual Eq. 2 and Eqs. 4–8 at `/tmp/atlas-soc-krapivsky2000-page-2.png`. Its conclusions are scoped to the stated kernels/growing-network limit; an early vertex is not asserted to win every finite realization.

**Dorogovtsev, Mendes and Samukhin, “Structure of Growing Networks: Exact Solution of the Barabási–Albert’s Model,” actual arXiv:cond-mat/0004434v1, 26 April 2000.** This title/version differs from the later PRL title and is identified accurately in public refs. Source: https://arxiv.org/abs/cond-mat/0004434v1. Retained `/tmp/atlas-soc-dms2000.pdf` (4 pages), SHA256 `9d9edc0c8046a45f38751aaa279c55830717424180e627b3cae8adc0e7ba171f`; matching extraction SHA256 `2801f9389b9e816b50e77fec4349c8a05ef3a74b39b08c5a6b9d674c79815a6e`.

Read the main text through its conclusion, including the incoming-degree/initial-attractiveness definitions, permitted repeated endpoints, finite binomial master equation, limiting balance, exact gamma-function law and its prefactor, exponent and mean-age formulas, and qualifications. Inspected actual Eqs. 2–13 at `/tmp/atlas-soc-dms2000-page-2.png` and `...-page-3.png`. The source expressly distinguishes its exact discrete prefactor from the continuum approximation. No claim to have read the later published version is made.

**Clauset, Shalizi and Newman, “Power-law distributions in empirical data,” 2009 author version.** Source actually used: https://snap.stanford.edu/class/cs224w-readings/clauset09powerlaw.pdf. Retained `/tmp/atlas-soc-clauset2009.pdf` (43 pages), SHA256 `6bd886dabe7e8b7e7481f619b84ab018e020a38f26c515f0ef00bf2950e1732a`; extraction SHA256 `241c81ae6788e9008fed83b277b3f72fa4b619eb03415f749ccf0ab8d39fa400`.

Read §3.1's continuous-versus-discrete assumptions and formulas, particularly Eqs. 3.3–3.7 on PDFpp.5–6. Inspected the actual formula page `/tmp/atlas-soc-clauset2009-page-6.png`. Eq. 3.7 is a half-integer approximation to the exact discrete zeta MLE. The paper's approximate-accuracy observations assume genuine power-law observations; they are not an iid confidence guarantee for dependent degrees in one grown graph. No full43-page reading, bootstrap implementation or fit-test claim is made.

Unread Yule/Simon/Price priority and Bollobás proof attributions are removed from these two objects. Item4.9 is now named “Preferential attachment and nonlinear kernels,” matching its actual source/model scope and syllabus row. No real-network data or inferred empirical mechanism is used.

## Prerequisites and scope

Read the actual authored `soc-4.7` body: continuous tail versus density exponents, discrete degree background and finite-sample caution. Only that power-law vocabulary is needed by4.9, so it remains the direct prerequisite. The old `stoch-12.10` dependency names a planned Pólya-urn item without an authored body and its convergence theorem is not used; it is removed. Item4.10 builds on the actual4.9 finite-process definitions. Chapter and syllabus rows agree. This audit does not clear or endorse all claims of neighboring4.7.

The theorem in4.10 is stated for the declared stationary rate equation, not as a rigorous finite-sample stochastic convergence theorem. The simulation/limit distinction is explicit throughout.

## Exact finite conventions

**4.9:** two seed vertices joined by one undirected edge; each newcomer chooses one earlier endpoint with probability proportional to pre-edge `k^gamma`, for gamma in[0,2]. The new edge updates both degrees. The process is a simple tree with N−1 edges and degree sum2(N−1). Parent records are retained and reconstruct the complete degree array. The two seed vertices have equal age; indices do not impose a strict oldest-first degree ranking.

Uniforms use a seeded53-bit stream. Weighted draws use a Fenwick cumulative table. A draft boundary-uniform test found that accumulated floating-point total weight could select an unpopulated trailing category at a uniform arbitrarily close to1. The corrected sampler computes the active prefix mass and searches only populated categories, assigning the residual final interval to its actual last category. It passes independent cumulative-weight comparisons, including exact CDF ties and both extreme uniform endpoints. It does not silently clamp a nonexistent target to an unrelated vertex.

**4.10:** seed is the clique on m+1 vertices, each initial degree m. Each newcomer draws m earlier endpoints independently **with replacement**, using the frozen pre-arrival graph. A draw is uniform with probability p, otherwise uniform over existing edge ends. All degree/edge updates occur after all m choices. Repeated endpoints produce parallel edges and are retained. There is no retry cap, missing edge or new-vertex self-selection. Full endpoint records reconstruct degrees and the count of extra parallel edges.

At N vertices,

`E_N = mN − m(m+1)/2`, `D_N=Σk_i=2mN−m(m+1)`.

For p<1, the next-arrival probability is

`W_i=(1−p)k_i/D_N+p/N=(k_i+a_N)/(D_N+Na_N)`,

where `a_N=pD_N/[(1−p)N]`. Hence

`a_inf−a_N = m(m+1)p/[(1−p)N]`, `a_inf=2mp/(1−p)`.

The finite process is therefore time-dependent in its equivalent affine shift; it is not exactly a constant-a process. For p=1, W_i=1/N directly, and no finite a or power-law exponent is invented.

DMS uses directed incoming degree q and weight `A^(0)+q`. For non-seed degree classes, total degree k corresponds to q=k−m and `A^(0)=m+a_inf`. Their dimensionless a is `A^(0)/m`, **not** our additive shift a. Their exponent `2+A^(0)/m` is therefore `3+a_inf/m`. The seed and finite degree sums differ, as explicitly stated; no literal finite directed-record equivalence is asserted.

## Stationary derivation and checks

With beta=m/(2m+a), integer m>=1 and a>−m, the stationary balance is

`P_k + beta(k+a)P_k − beta(k−1+a)P_(k−1) = 1_(k=m)`.

Its recursion and gamma-function solution give exponent `eta=1+1/beta=3+a/m`. At a=0 the exact coefficient is **2m(m+1)**, so `P_k~2m(m+1)k^-3`; the prior `~2m²k^-3` is false for fixed m. The continuum coefficient differs, as DMS explicitly explains.

Writing `F_K=beta(K+a)P_K`, summing the balance gives the exact tail identity `Σ_(m…K) P_k + F_K = 1`. A weighted sum gives

`Σ_(m…K) kP_k + [(K+1+beta*a)/(1−beta)]F_K = 2m`.

These verify normalization and mean without pretending a truncated array sums to1. The displayed probability beyond the last plotted degree is F_K; no truncation renormalization is applied. At p=1, the independent uniform limit is geometric:

`P_k=[1/(m+1)] [m/(m+1)]^(k−m)`.

The plotted blue probabilities use every vertex and actual integer degree, without binning. Green is the stationary recurrence at every displayed integer. The black slope guide is explicitly anchored and has a declared finite domain; it is not falsely normalized as the exact asymptotic amplitude or fitted to the observations. All views pad the actual positive plotted ranges, including very steep guides, sampled hub endpoints and full marker radii.

## Tail statistic and controls

The reader selects k_min from6…2000, keeping it at least every offered m and allowing genuine empty-tail exploration. The statistic is `1+n_tail/Σln[k/(k_min−.5)]`, precisely the labeled CSN approximation. Zero observations gives `estimate:null` and an explicit undefined message. Positive support below50 gets an **authored support warning**, not a claim that the mathematical statistic is undefined or that50 guarantees validity. Because graph degrees are dependent, no iid standard error, confidence interval or power-law verdict is displayed. The old promise of monotonic convergence of estimated exponents is removed.

New tree/New network genuinely change seeds. Each item registers its seed with the runtime's share-state adapter, so saving/restoring controls and the seed reproduces the actual finite graph. Caches are bounded and keyed by all simulation inputs. No source dataset or hidden observational input is involved.

## Independent mathematical verification

```sh
node --test tests/verification-soc-attachment.test.mjs
```

`/tmp/atlas-soc-attachment-math-final.log`: **5 groups pass**, actual command exit0. The suite first passed as `/tmp/verification-soc-attachment.test.mjs` before installation into the default test glob.

- All41 kernel values at eight seeds and N40 agree with an independently implemented direct cumulative-weight tree. Seven representative kernels at uniform0,.5 and1−2^-53 agree through N1000, including half-open CDF boundaries. Larger N20000 cases verify full parent/degree bookkeeping.
- Every m1…6 ×p0,.05,…,1 at small finite sizes agrees exactly with an independent edge-list implementation. An explicit repeated-target fixture verifies frozen probabilities and delayed updates. Pure-uniform boundary streams verify all extra parallel records and degree conservation at N1000.
- Every m1…6, seed/current sizes and several mixtures verifies D_N, the exact finite affine identity for every actual degree, seed-correction magnitude and the separate uniform endpoint. The DMS degree/attractiveness mapping is checked algebraically.
- All m1…6 at six shifts, including allowed negative a near−m, verify the stationary balance through degree10000, exact pure-BA probabilities, mass/tail and mean/tail identities, exponent and fixed-m coefficient. Uniform geometric laws and their p→1 numerical limit are separate.
- Complete empirical count/survival fixtures, zero/one/49/50/100 tail observations, support warnings, positive log padding and invalid-parameter rejection are checked. These tests support the implementation; the stationary algebra above supplies the general argument.

## Native browser and visual evidence

```sh
node tests/verification-soc-attachment.mjs
```

`/tmp/atlas-soc-attachment-native-final.log`: **8 groups pass** (both items at1450/430pixels ×light/dark), final session9615 exited0 and closed the browser. The final run includes the threshold control and full scope rendering. Static `node scripts/check.mjs soc-4.9 soc-4.10 --static` passes2items,0errors,0warnings; `/tmp/atlas-soc-attachment-static-final.log`, session58706 exited0.

For4.9, each group covers all41 kernels at N1000, plus five linear/sublinear/superlinear regimes at N5000/20000; every parent record reconstructs the plotted degrees. Independent full frequency/survival calculations check every dot/curve/bar and the limiting CCDF. Native Home/End/ArrowLeft, reseeding and a real runtime snapshot/remount restore controls, seed and the complete degree array.

For4.10, each group covers every m1…6 with p={0,.5,.95,1} at N1000, every21 mixture value at m3/N1000, and m={1,6},p={0,.8,1} at N10000/100000. Full endpoint records reconstruct degrees; counts, edge totals, parallel totals, every empirical probability, stationary probability, finite shift, guide and tail statistic agree with independent calculations. Pure uniform has no power-law guide/shift/exponent. Threshold2000 produces a genuinely empty tail and its undefined explanation; Home/End/ArrowLeft on the log threshold and both linear sliders exercise actual configured endpoints. New-network and runtime share-state roundtrips reproduce the complete degree array.

All path half-strokes, all dot radii (including core rings where applicable), all40 bar rectangles, measured canvas labels, display TeX and page bounds pass. The harness recognizes typographic minus signs and log-domain thumb coordinates separately from exact integer threshold outputs. An early harness serialization pass confused4.9's reference-point array with4.10's law object; the actual production models did not fail. A threshold-integration pass also correctly exposed that a log DOM input is not the physical k_min value; the final harness checks its log domain plus exact displayed/model values and native endpoints.

Actual images inspected:

- `/tmp/atlas-soc-attachment-4.9-superlinear-430-light-panel0.png`: complete hub-end CCDF and limiting reference, with no cropped low-probability line.
- `...-4.9-superlinear-430-light-panel1.png` and `...-430-dark-panel1.png`: true highly concentrated first40 degrees; small bars remain small rather than being visually inflated.
- `/tmp/atlas-soc-attachment-4.10-steep-430-light-panel0.png`: stationary body versus steep, explicitly anchored exponent guide.
- `/tmp/atlas-soc-attachment-4.10-uniform-1450-dark-panel0.png`: full empirical degree frequencies and geometric law.
- Final full `/tmp/atlas-soc-attachment-4.10-empty-tail-430-dark.png`: actual threshold2000, undefined statistic, controls, corrected fixed-m formula, finite/limiting distinction and scope.
- Full4.9 linear mobile light and4.10 linear desktop light pages were also inspected; all controls, formulas and prose fit. The native-size panels establish plot detail separately from a downscaled tall-page image.

Read-only byte guards prove all chapter content outside4.9/4.10/new import and all syllabus content outside their two rows unchanged against HEAD. Shared `ch04.shared.js` is untouched. `git diff --check` passes. No full build or central queue reconciliation is claimed.

## Frozen paths

- `content/soc/ch04-b.js`: only4.9/4.10 and new isolated import.
- `content/soc/syllabus.js`: only4.9/4.10 rows.
- `content/soc/source-audit-attachment.js`.
- `tests/verification-soc-attachment.test.mjs`.
- `tests/verification-soc-attachment.mjs`.
- `docs/verification/soc-attachment-followup.md`.

Both source flags are cleared following independent parent integration. All retained source-specific claims have identified primary reading support; all finite numerical observations are generated and checked as declared authored models.

## Independent integration

Root read both complete public objects, the isolated helper and both test scripts, and actual soc4.7's prerequisite statement/argument. Root checked BA's actual p511 model/continuum passage, KRL's degree convention and Eqs1–8/nonlinear regimes, DMS's finite multiple-link setup and Eqs2–13, and CSN§3.1/Eqs3.3–3.7; actual BA p511, KRL p2, DMS p2–3 and CSN p6 images were inspected. The separate counter-review read the full KRL main text and DMS main text through its conclusion, along with those BA/CSN passages; no full43-page CSN reading is claimed. All four PDF hashes match above.

Independent algebra checked the clique degree sum, frozen endpoints, finite affine identity and directed-degree mapping. A separate Python log-Gamma evaluation of DMS Eq10 agrees with210 recurrence probabilities across m1–6 and six shifts (including negative shifts), maximum relative difference1.19e−12. The mass/mean tail identities and pure-uniform endpoint agree. Counter-review wording refinements are applied: threshold6 is at least all offered m, and the actual inclusive filter is described as “at or above”.

Root reran all5 independent mathematical groups, all8 native viewport/theme groups, and scoped static validation (2items,0errors,0warnings). Every process exited0. Logs: `/tmp/atlas-root-soc-attachment-{math,native,static}.log`. Full finite degree/edge/parallel records, all controls and offered domains, limiting curves, empty-tail diagnostics, seeds and runtime replay are checked as described above. Root inspected the final430px dark empty-tail full page and430px light superlinear CCDF panel; also the430px light linear full page,430px dark first40-degree bars and1450px dark uniform-law panel. Byte guards preserve all content outside4.9/4.10 and the new import/separator, both other syllabus regions and shared helpers. The initial read-only guard needed to remove the import's added blank separator as well; no product or ledger mutation followed that failed guard. Generated data and the last full checkpoint are unchanged by this integration.
