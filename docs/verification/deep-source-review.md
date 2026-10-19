# Deep-learning verification

All four initial source checks (`deep-4.5`, `deep-4.8`, `deep-5.8`, `deep-5.10`) are closed against complete source documents and the relevant full sections below. These closures do not certify other historical claims in the collection. Native browser checks passed in all eight light/dark groups, including range endpoints, segmented choices, toggles and pointer drags. All eight screenshot panels were manually inspected. Evidence: `/tmp/atlas-deep-browser.json` and `/tmp/atlas-deep-browser.log`.

| Item | Complete source and passages read | Correction |
| --- | --- | --- |
| 4.5 | Duchi–Hazan–Singer (2011), full JMLR paper, §1.1 pp.2122–2123, diagonal update (1); complete Hinton lecture 6 PDF, RMSProp and adjacent slides; Kingma–Ba, full Adam paper, Algorithm 1 and §§2–3 pp.2–3 including the moment-bias derivation and the RMSProp bibliography entry | Adam's zero-initialization corrections give unbiased moment estimates under stationary moments; arbitrary gradient histories do not imply a step of size eta. RMSProp credit follows the paper's Tieleman–Hinton 2012 lecture citation. Removed an uninspected Reddi attribution and the universal assertion that no RMSProp paper exists. |
| 4.8 | Kawaguchi, full arXiv:1605.07110v3, model §2.1, Theorem 2.3 and Corollary 2.4 pp.2–3, complete proof sketch §4.3 pp.7–8 | Restored `d_y <= d_x`. Replaced the insufficient convex-product argument with the rank-constrained case split. The paper counts hidden layers whereas this card counts weight matrices; this is translated explicitly. Removed uninspected Baldi–Hornik priority annotation. Finite gradient-descent paths can stall or diverge and do not certify convergence. |
| 5.8 | Haber–Ruthotto, full original arXiv:1705.03341v1 (9 May 2017), §§2–3 pp.3–5 including equations (2.1), (2.4), (3.6); Chen et al., full original arXiv:1806.07366v1 (19 June 2018), introduction pp.1–2 and uniqueness/reversibility discussion p.9 | The claimed first-order Euler rate now includes time regularity. Homeomorphism describes the limiting ODE flow; a finite Euler stack need not be invertible. Replaced “exact flow” with a 400-step RK4 numerical reference throughout the visible demo. The Weinan E 2017 publisher URL returned a paywall HTML page; the uninspected priority annotation is removed rather than treated as a read source. |
| 5.10 | Arora–Li–Lyu, full arXiv:1812.03981v1 (December 2018), Definition 2.1 and Lemmas 2.2/2.4 with their complete proofs, pp.3–6; additive variance constant caveat p.3 | Exact scale invariance needs zero normalization epsilon and nonzero variance. The actual experiment now uses that model, excluding the undefined origin. A learned gamma does not itself break invariance of incoming weights. Qualified the decay-balance formula as a small-step stationary heuristic. Removed uninspected historical annotations. |

## Independent numerical evidence

`tests/verification-deep-source.test.mjs`: **5 groups pass** (`/tmp/atlas-deep-math-complete.log`).

- Adaptive optimizer trajectories at steps 1, 2, 10 and 100, for three curvature/rate settings and five method/correction choices, agree with independent Python Decimal recurrences at precision 60. First-step coordinates separately check the published update equations.
- The actual residual-field RK4 reference agrees with independent SciPy 1.17 DOP853 (`rtol=2e-13`, `atol=2e-14`) at 15 point/amplitude combinations within `2e-9`, including the maximum amplitude 3. A 400-to-800-step RK4 refinement stays below the same tolerance. Euler's 64/128/256-step errors have first-order refinement ratios between 1.85 and 2.15.
- Ideal batch-normalized logistic gradients agree with central finite differences, positive scaling symmetry, gradient/weight orthogonality, and the exact Pythagorean norm update. The zero-variance origin is undefined, not assigned an artificial loss.
- The unflagged `deep-5.3` timeout was resolved using exact positive homogeneity of zero-bias ReLU networks: the same weight draw at variance `c_w` is the baseline variance-2 run scaled layerwise. Independent full resimulation checks both forward signal and backward gradient at five variances and two seeds; native checks pass in both themes.

Oracle data and its optional NumPy/SciPy generator are checked in under `tests/fixtures/deep-source-oracles.json` and `tests/fixtures/generate-deep-oracles.py`. They do not add a Python dependency to `npm test`.

## Source identity

| Source URL | SHA256 of complete downloaded document |
| --- | --- |
| https://www.jmlr.org/papers/volume12/duchi11a/duchi11a.pdf | `691043712c05c19c98223fba52507beff0480afb11fa17ea40a2a032d6f0bf3c` |
| https://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec6.pdf | `328eff5e413f16004bce8857598b34be798c4d15e7fc7ecbe85c1da6e16b9fd1` |
| https://arxiv.org/pdf/1412.6980 | `eab9c73ae2ceda884b94830bda99312254bac4806f6c9f045cbab90721ecda31` |
| https://arxiv.org/pdf/1605.07110 | `37715bfa4031440b4489373d5ea11e27bf27f44d073a3a2d6b4889f2dd9a0b8b` |
| https://arxiv.org/pdf/1705.03341v1 | `30d97e0c00c4c7960d52f074ccfcf7dec6ba843b1b2264ebdb6bdcef3b48f662` |
| https://arxiv.org/pdf/1806.07366v1 | `5bc31ec1ab6ba56aa892ecef04ef4b097b378767184cad4486ac0a79d6679433` |
| https://arxiv.org/pdf/1812.03981v1 | `521f752468ec50e32dfa58c0bbc8ea3b1739380d83608f3f4551650e58712554` |

The unversioned Neural ODE URL currently returned a 2026 revision. It was not used to establish the 2018 original's claims. Source downloads live under `/tmp/atlas-*.pdf` in this execution workspace; hashes identify documents if those temporary files expire.

Adjacent formula corrections: `deep-5.9` now states the actual normalized variance `sigma²/(sigma²+epsilon)` and correctly describes batch size one as defined but input-independent when epsilon is positive. This was checked against the complete original Ioffe–Szegedy paper, Algorithm 1 and the full training/inference discussion pp.3–4, which explicitly neglects epsilon when claiming unit variance. `deep-5.11` now qualifies its caption's scale-invariance claim for the same reason. These are local formula/caption corrections, not a new closure of every historical or empirical claim in those adjacent cards. Source: https://arxiv.org/pdf/1502.03167v1, SHA256 `4591881ed6e7b3815eaa7c13cb8d8cc1c807ca5411150c11d11f718e6ba48949`.

The complete first Adam preprint was also checked (https://arxiv.org/pdf/1412.6980v1, SHA256 `935a5a15616961aff21529d86a754570028843407adfe858f1d18584b84293a7`), Algorithm 1 and full §§2–3 pp.2–3. Its beta parameters weight the new gradient, whereas the later revision and this display use beta for the retained old estimate. The recurrences and bias corrections are equivalent after replacing each beta with one minus beta; the page follows the later standard convention.
