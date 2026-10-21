# Psychology3.10 — classical multidimensional scaling

**Resolved: psych-3.10.** Independent root source, derivation, model, browser and screenshot checks passed; the actual flag and ledger are reconciled. Scope is only 3.10, its isolated import/helper, matching syllabus row and dedicated tests/report. Neighboring work is preserved. The separate runtime font correction is recorded in `runtime-fonts-followup.md`.

## Actual source read

Read all 7 pages of **Christopher K. I. Williams, [On a Connection between Kernel PCA and Metric Multidimensional Scaling](https://proceedings.neurips.cc/paper_files/paper/2000/file/d4b2aeb2453bdadaa45cbe9882ffefcf-Paper.pdf), NIPS2000, Advances in Neural Information Processing Systems13 (proceedings2001)**, from the official NeurIPS archive. This is Williams's own technical paper, with his explicit exposition of classical scaling in§2.1 and metric/nonmetric distinctions in§2.3, not an alleged directly inspected Torgerson original or dataset replication. The author's own publication list also identifies the proceedings volume as2001; the conference archive uses2000.

Local `/tmp/atlas-psych-williams2001.pdf`,7 pages / 1,333,639 bytes, SHA256 `27a99d036f6572a0466403e3d996c395f404e38445d292f6c24c6cd72fc833ba`; direct text `/tmp/atlas-psych-williams2001.txt`, SHA256 `c5bae26352c281424f455042578069c499828c2b8d62b707acfc6b9deeb35683`. PDF pages2/3 were rendered at 135 dpi and visually inspected at `/tmp/atlas-psych-williams2001-source-{2,3}.png`, including the squared-distance centering factors, Gram factorization, eigenvalue square roots and the distinct stress formula. The complete text, including the nonmetric paragraph onPDF4 and discussionPDF7, was read. Reproduce acquisition with `curl -L --max-time 60 '<official PDF URL above>' -o /tmp/atlas-psych-williams2001.pdf`, and extraction/rendering with bundled Python/pdfplumber: `page.extract_text()` and `page.to_image(resolution=135).save(...)` for zero-based pages1/2.

The original Torgerson1952 publisher/mirror routes did not yield an inspectable full original; no full original reading is claimed. Kruskal1964 and Ekman1954 originals were not read. Their inherited priority, Stress-1 and empirical-color-data claims are removed. The public credit explicitly identifies Williams's technical account and does not rename it as the origin of classical scaling.

Williams§2.1 derives the centered Gram matrix, PSD factorization and eigen construction, explains rigid-coordinate freedoms and notes that non-Euclidean dissimilarities can yield negative eigenvalues. His projection optimality theorem concerns loss of squared distances under orthogonal projections, not a claim that the displayed target-normalized raw-distance RMS is minimized. Section2.3 treats stress optimization separately and introduces the monotone relation of nonmetric scaling. None of its optimization algorithms or kernel-MDS extensions is claimed to run in this widget.

## Real prerequisites and theorem derivation

Read `AUTHORING.md`, the everywhere/social-science sections of `docs/fields.md` and the actual written **ladr-7.29**, **ladr-7.38**, **prob-1.2.5**. The real spectral theorem supplies orthonormal eigenvectors for symmetric B. Positive-operator characterizations supply nonnegative eigenvalues and Gram/square-root factorization. The normal density/Box–Muller account supplies the authored symmetric Gaussian noise table used in the picture. Thurstone3.7 is related background, not a mathematical input; it moves to `see`.

For n≥2, let δ be symmetric, finite and nonnegative, with zero diagonal. Set `J=I−11ᵀ/n`, `B=−J[δ²]J/2`. If δ consists of Euclidean distances, expanding squared norms and applying J removes the two norm-only terms, giving `B=X_c X_cᵀ`, hence B is PSD and `B1=0`. Conversely the double-centering formula and zero diagonal give `B_ii+B_jj−2B_ij=δ_ij²`. If B is PSD, its orthonormal eigenbasis and square roots therefore construct exact distances. Its rank r≤n−1 is the minimum necessary Euclidean dimension; all positive r directions reproduce the exact Gram matrix. Coincident points and rank0 are allowed.

The full exact geometry is determined up to rigid translation/rotation/reflection. Scaling is fixed by δ. Truncating through a repeated positive eigenvalue can select different subspaces and different distance errors. A12-point circle provides an independent witness: projections at angles0 andπ/24 have equal Gram Frobenius error13.5 but different target-normalized distance error. The statement includes this nonuniqueness; no arbitrary numerical eigenbasis is treated as canonical at a tied cutoff.

The helper exposes raw eigenvalues and an explicit numerical cutoff `64*Number.EPSILON*n*max(abs(lambda))`. Eigenvalues above it are retained; negative and unresolved positive modes are omitted from coordinates. Positive/negative/near-zero counts are numerical diagnostics, not exact PSD/rank certificates. This controls roundoff near true zero eigenvalues without claiming an exact classification from a tolerance.

## Authored model and repairs

The12 authored planar points have complete pair distances. With s∈[0,.6], each unordered pair has one seeded standard-normal draw Z, mirrored to the other matrix entry, and target `δ_ij=||x_i−x_j|| exp(s Z_ij)`. Zero distances remain zero. The theoretical multiplier has median1; integrating `exp(sz) exp(−z²/2)/sqrt(2π)` after completing the square gives mean `exp(s²/2)`, greater than1 when s>0. The realized66 draws need not have exactly either population statistic. This is synthetic noise, not fitted judgments, unbiased measurement noise or real color data.

The inherited target-normalized error is retained under its direct name: `E_k=sqrt(sum_{i<j}(δ_ij−d_ij^(k))² / sum_{i<j}δ_ij²)`. It is not labeled sigma1/Stress-1 or represented as a direct distance-loss optimizer. The absolute RMS uses denominator66 and retains distance units. All-zero δ makes the normalized ratio undefined(0/0); its canvas/readout say so explicitly while reporting absolute RMS0. A zero truth radius similarly makes relative position error undefined, not NaN or a fabricated percentage. Four error dimensions do not imply that every noisy direction was retained, or establish psychological dimensionality. Small nonzero noise does not guarantee exact recovery at the original planar dimension.

The eigen fit is computed from δ alone. Truth is used afterward only for a rigid visual comparison. For each reflection sign, centered2D cross-correlation gives coefficients a,b, and the best rotation maximizes `a cos(theta)+b sin(theta)` at `atan2(b,a)`. Comparing the two reflection signs covers O(2). There is no fitted scale; a doubled configuration must retain doubled pair distances and incur a position RMS equal to the truth radius. Centering subtracts an anchor before taking means so identical nonzero points still have exactly zero radius; the inherited naive mean could have produced a spurious tiny radius and a meaningless ratio.

Input handles reach the entire[−2.3,2.3]² domain inside a padded[−2.9,2.9]² frame. The recovered frame uses every centered-truth and aligned-recovery coordinate with32% padding and a positive minimum span. Eleven coincident points at one corner plus an opposite outlier give centered coordinates beyond the inherited±2.4 frame; none are clipped or rescaled away. Grey truth rings are radius8; recovered filled dots radius5 remain visibly inside an exact-overlap reference ring. The diagnostic bars have padding below zero and above the largest data/label, including zero-height exact-fit bars. Coincident/outlier presets expose the degeneracies and bounds directly. Noise resampling uses a disclosed deterministic seed sequence for reproducibility.

## Verification evidence

Mathematical code is `tests/verification-psych-mds.test.mjs`, native code `tests/verification-psych-mds.mjs`, isolated helper `content/psych/source-audit-mds.js`. The draft math file passed before entering the default test glob.


`node --test tests/verification-psych-mds.test.mjs` passes **5 groups**, log `/tmp/atlas-psych-mds-math-final.log`. They independently verify:

1. Explicit centering-matrix multiplication, every Gram/distance identity, orthonormality and eigen residuals for ranks0–3, translated configurations, a square's repeated eigenvalues and a regular tetrahedron. Two1D circle projections prove equal Gram error13.5 need not imply equal distance error at a tied cutoff.
2. The impossible triangle(1,1,3) has exact eigenvalues4.5,0,−5/6. Its positive spectral reconstruction has distances(1.5,1.5,3), absolute RMS1/sqrt(6), target-normalized error1/sqrt(22), and Gram error5/6. The separate collinear competitor with distances(4/3,4/3,8/3) has squared distance loss1/3 versus the spectral loss1/2, proving that the algorithm must not be described as the direct distance-loss minimizer.
3. Translation/rotation/reflection invariance of the rigid alignment, preservation of all recovered pair distances, doubled-coordinate scale retention and exact zero radius for12 coincident nonzero points. The doubled example retains twice the pair distances while the alignment itself has scale1, and incurs position RMS equal to the truth radius; a fitted rescaling would wrongly erase it.
4. All256 four-point corner configurations, all 61 offered noise ticks for four representative12-point families, all 66 actual synthetic target distances, numerical counts/cutoff status, zero ratios and full data extrema. Cases explicitly exceed the old±2.4 recovered frame. Invalid asymmetry, nonzero diagonal, negative/infinite dissimilarities and invalid dimensions/noise are rejected.
5. Independent **NumPy2.3.5 `numpy.linalg.eigh`** references for nine circle/outlier/boundary cases at s=0,.1,.6: all 108 eigenvalues and36 dimension-specific Gram errors, plus distance RMS/normalized errors when the positive cutoff is not tied. The noiseless circle's1D eigenbasis is not identifiable; its solver-specific distance error is therefore not a canonical reference. The test checks the invariant Gram error there, and group1 independently demonstrates the two distinct valid projections. No failed-convergence case or nontrivial eigenvalue is excluded.

Reference generator `/tmp/atlas-psych-mds-reference.py` writes `/tmp/atlas-psych-mds-reference.json`, whose numeric expectations are embedded in the dedicated test. Its complete independent recipe is below. The generated coordinates are calculated by NumPy's LAPACK-based solver, not the production Jacobi helper.

```python
import numpy as np,json
out=[]
for name in ('circle','outlier','boundary'):
 if name=='circle':X=np.array([[1.5*np.cos(i*np.pi/6),1.5*np.sin(i*np.pi/6)] for i in range(12)])
 elif name=='outlier':X=np.array([[2.3,2.3]]+[[-2.3,-2.3]]*11)
 else:X=np.array([[2.3*(-1 if i%2 else 1),2.3*(-1 if i%3 else 1)] for i in range(12)])
 Z=np.array([[0 if i==j else np.sin((i+1)*(j+1)) for j in range(12)] for i in range(12)])
 for sd in (0,.1,.6):
  D=np.linalg.norm(X[:,None,:]-X[None,:,:],axis=2)*np.exp(sd*Z);J=np.eye(12)-np.ones((12,12))/12;B=-.5*J@(D*D)@J;val,vec=np.linalg.eigh(B);val=val[::-1];vec=vec[:,::-1];tol=64*np.finfo(float).eps*12*max(abs(val));used=np.where(val>tol,val,0);fits=[]
  for k in range(1,5):
   Y=vec[:,:k]*np.sqrt(used[:k]);d=np.linalg.norm(Y[:,None,:]-Y[None,:,:],axis=2);num=np.sum(np.triu((D-d)**2,1));den=np.sum(np.triu(D*D,1));fits.append([float(np.sqrt(num/den)),float(np.sqrt(num/66)),float(np.linalg.norm(B-Y@Y.T))])
  out.append({'name':name,'sd':sd,'eigenvalues':val.tolist(),'fits':fits})
print(json.dumps(out,separators=(',',':')))
```

The narrow native run passed before the full matrix, with log `/tmp/atlas-psych-mds-native-debug.log`. A later intermediate full run stopped on a readout-whitespace assertion after wording was improved from `exactly1` to `exactly 1`; the assertion was synchronized and the complete frozen run restarted. No numerical or data-bounds defect was bypassed. Final native completion and screenshot inventory follow below.


`node tests/verification-psych-mds.mjs` passes **all 4 final native groups**,1450/430px × light/dark, log `/tmp/atlas-psych-mds-native-final.log`; the process exited0 and its browser/server are closed. In each group it exercises all five real preset buttons at both actual noise endpoints, all 61 noise tick, five real noise-resampling clicks and all 12 native handles at all four exact input corners. Handle drags deliberately cross the stated boundary and verify the actual clamped±2.3 values. Each state retains and independently reconstructs all 66 dissimilarities, checks symmetry/zero diagonal, every centered-Gram/distance identity, all four fitted distance errors, rigid-only pair distances and position-RMS/radius accounting. Coincident presets require explicit undefined ratio status and zero absolute error rather than a fake normalized bar.

All12 true/recovered point coordinates,12 connecting segments, all diagnostic bars, complete hollow reference strokes, filled recovered rings, every handle stroke, canvas text extent/halo, TeX overlays/display equations and page bounds are verified in real pixels. The recovered frame includes every centered truth and recovered extreme. No data, negative mode or duplicated point is silently removed to satisfy bounds. Degenerate or overlapping markers are retained as distinct data records.

Final screenshots inspected include the complete `/tmp/atlas-psych-mds-default-430-{light,dark}.png` pages; `outlier-End-430-{light,dark}-panel1.png`; `coincident-End-430-{light,dark}-panel2.png`; `circle-Home-430-light-panel2.png`; and `boundary-drag-1450-dark-panel0.png`, with the same `/tmp/atlas-psych-mds-` prefix. They show all actual controls and math, unchanged distance units, separate grey truth rings/colored recovered points, the outlier's full adaptive frame, complete zero-height exact-fit bars and the explicit zero-denominator message. Both themes are legible at narrow width.

Scoped static `node scripts/check.mjs psych-3.10 --static` reports **1 item, 0 errors, 0 warnings**, log `/tmp/atlas-psych-mds-static.log`. Read-only object/import/row guards compare the source with `/tmp/atlas-psych-mds-{chapter,syllabus}-before.js`, normalizing only the separately accepted parent-owned3.8 flag flip. All other neighboring bytes, including the complete3.8 model, are identical. No full build or Git mutation is performed. Both final test processes have exited0;3.10 remains `verify:true`. Production/helper/tests/report are frozen for independent parent source/math/native acceptance, without a human review gate or agent-claimed queue closure.

## Independent root acceptance

Root read the actual Williams PDF pages 2–4 through the classical-scaling derivation, the metric/nonmetric distinction and its nonmetric continuation, and inspected the actual formula images on pages 2 and 3. This is a narrower direct reading than the agent’s seven-page read above. Root also read the complete production helper, public item, all five mathematical test groups and native script, and the actual written statements/proofs of ladr-7.29, ladr-7.38 and prob-1.2.5. The dependencies supply the symmetric spectral basis, PSD factorization and normal-noise construction.

Root independently checked the centering converse, rank bound, rigid O(2) alignment with no fitted scale, repeated-cutoff nonuniqueness, lognormal median/mean and zero-denominator distinctions. In particular, the impossible triangle’s positive spectral fit has squared raw-distance loss 1/2 while the separate collinear competitor has loss 1/3; it is therefore correctly not claimed to minimize that loss.

Root reruns pass all **5 math groups**, **4 native groups** (1450/430 px, both themes), and static **1 item / 0 errors / 0 warnings**. Logs are `/tmp/atlas-root-psych-mds-{math,native,static}.log`; every process exited 0. The native rerun uses the separately corrected font-completion runtime. Root inspected the final complete 430 px light/dark pages and the outlier, coincident undefined-ratio and noiseless dimension panels. All 12 points and 66 dissimilarities remain present, including repeated points and negative numerical modes. Only this item and its exact syllabus row/import are staged for acceptance.
