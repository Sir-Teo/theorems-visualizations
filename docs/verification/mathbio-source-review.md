# Mathematical-biology source follow-up — 18 October 2026

Closes mathbio-2.14, mathbio-3.6, mathbio-3.8, mathbio-3.17, mathbio-3.19, mathbio-3.20, mathbio-3.22, mathbio-3.23, mathbio-4.4 and mathbio-4.10. Five other source flags remain; this is a focused follow-up rather than a complete source audit of the collection.

## Evidence read

- [Lotka (1920), Analytical Note on Certain Rhythmic Relations in Organic Systems, complete six-page original](https://jxshix.people.wm.edu/2009-harbin-course/classic/Lotka-1920-PNAS.pdf), PNAS 6:410–415, doi:10.1073/pnas.6.7.410. Read all six pages; visually checked Eqs. (5)–(12) on p. 412 and the shifted variables and characteristic roots on p. 413. The original allows density-dependent coefficients; the visualization's exact periodic-orbit statement is restricted to positive constant coefficients. The displayed variables are explicitly rescaled from the original rather than described as an unchecked reconstruction.
- [Volterra (1926), Fluctuations in the Abundance of a Species considered Mathematically, complete three-page original scan](https://francesco-ferraro.com/lotka-volterra/volterra1926fluctuations.pdf), Nature 118:558–560, doi:10.1038/118558a0. Visually read the entire article on all three original pages, including Laws I–III, both diagrams, the small-oscillation formula and the fisheries discussion. Page 559 explicitly reports D'Ancona's wartime selachian-catch comparison and identifies his forthcoming 1914–18 study; this short note does not reproduce catch tables. The content now attributes that observation to Volterra's report without claiming an independent audit of D'Ancona's original measurements.
- [Lotka and Volterra (1927), complete original correspondence](https://francesco-ferraro.com/lotka-volterra/lotka1927letter.pdf), Nature 119:12–13. Visually read the complete letter and reply across both pages. Volterra acknowledges Lotka's priority for the two-species equations and small-oscillation period, while distinguishing the remaining parts of his own investigation.

Originals and rendered evidence are under `/tmp/mathbio-primary`. The downloaded 28-page Holling 1959 paper concerns sawfly predation (doi:10.4039/Ent91293-5); it is not the separate disc-experiment paper cited by mathbio-3.8. The Cambridge short PDF URL returned a rendered abstract/login page, not that original paper, so it is not accepted as full evidence and 3.8 remains flagged.

## Corrections and outcomes

| Item | Outcome |
| --- | --- |
| mathbio-3.6 | Closed. Original observational attribution checked directly, with the underlying-table limitation explicit. Corrected the explanation that contradicted its own mean equations: additional predator mortality requires more average prey to sustain predator growth; reduced net prey growth supports fewer predators. Distinguished full-cycle means from a transient trajectory and stock density from fish-market catch composition. |
| mathbio-3.22 | Closed. Checked the actual plant–herbivore equations and notation. Added the coefficient restriction and rescaling. Corrected the suggestion that nonlinear periodicity is only a linearized result, and explained that imaginary eigenvalues alone do not prove a nonlinear center. Removed an unsupported broad historical claim that previous accounts of natural rhythms generally required external periodic forcing. |
| mathbio-3.23 | Closed. Read the original three laws and both figures directly, plus the priority correspondence. Fixed the law-1 marker/readout, which ignored the dragged start's y coordinate and clamped negative horizontal offsets: it now measures a period on the actual trajectory and maps that orbit to its equal-invariant positive section offset. Equilibria or unresolved complete cycles receive an explicit readout rather than NaN or an invented period. Expanded orbit, running-average and harvest axes to show values produced by extreme controls. |

## Validation

- `node tests/verification-mathbio-source.test.mjs`: six groups; original-variable rescaling and linear roots, numerical conservation and small-amplitude limits, arbitrary positive start points versus the equal-energy reference section, and independently integrated harvested means over complete cycles.
- `node scripts/check.mjs mathbio --static`: 71 items, zero errors or warnings.
- `node tests/verification-mathbio-source-browser.mjs`: real Chromium, serial light/dark controls and pinned KaTeX using `installBrowserAssets`; exercises harvesting/rate extremes, clearing orbits, all three laws real pointer drags to an off-section start, and the exact-equilibrium button. Final evidence is `/tmp/mathbio-source-verification-browser.json`, screenshots `/tmp/mathbio-source-verification-shots/`.

## Initial-flag coverage ledger

This records the actual review state; a source-location attempt alone is not a completed item review.

| Initial item | Status |
| --- | --- |
| mathbio-2.14 | Closed; complete May1978 paper and appendices read, equilibrium/Jury threshold independently checked, exact marginal boundary corrected. |
| mathbio-3.12 | Reviewed; Brusselator Jacobian/Hopf conditions checked; corrected unsupported global-jump assertion. Full original/complete modern normal-form source still open. |
| mathbio-3.14 | Reviewed; complete displayed checklist/model code inspected and direct counterexamples to caption identified. Corrected type-III/root and LV hypothesis claims; exact original theorem/inequality evidence remains open. |
| mathbio-3.17 | Closed; full Hardin1960 and complete relevant Gause1934 chapter read; conditional/neutral limit corrected, independent overlap/competition checks and real controls. |
| mathbio-3.19 | Closed; complete original Novick–Szilard1950 pp715–716 and Hsu1977 read; separated device from later ODE model and narrowed unsupported historical credit. |
| mathbio-3.20 | Closed; complete original Hsu–Hubbell–Waltman1977 read, exact assumptions/ties/finite-time controls and independent mass balance checked. |
| mathbio-3.22 | Closed; evidence and validation above. |
| mathbio-3.23 | Closed; evidence and validation above. |
| mathbio-3.6 | Closed; evidence and validation above. |
| mathbio-3.7 | Reviewed; both equilibrium Jacobians checked analytically; fixed universal-perturbation and limit-cycle robustness claims. Full 1937 original remains unlocated. |
| mathbio-3.8 | Closed; complete original disc paper now read in IA scan; complete protocol/handling/depletion limitations corrected, response math and real controls checked. |
| mathbio-4.10 | Closed; original Crouse1987 Table4 and complete relevant model/sensitivity sections read; Caswell2019 full §3.3 original-author derivation/history read. Matrix/derivative/ranking checks passed. |
| mathbio-4.12 | Reviewed; stationary projection/normalization and no-change endpoint independently checked; qualified global growth claim. Exact original Keyfitz1971 PDF/OCR returns403, retained. |
| mathbio-4.14 | Reviewed; characteristic/newborn scheme corrected and independent eigenmode/positivity checks pass. Full McKendrick1926/vonFoerster1959 sources and exact asymptotic hypotheses remain open. |
| mathbio-4.4 | Closed; complete Lotka1922 original read with source-image checks; finite-matrix analogue/proof identified explicitly. Extinction/reducibility/periodicity controls and independent math passed. |

## Competitive-exclusion follow-up

Read the complete original [Hardin (1960), Science 131:1292–1297](https://faculty.washington.edu/stevehar/hardin1960science.pdf), all six pages, including the weak unequal-growth formulation, axiom-of-inequality caveat, empirical-testing discussion, eponymy and naming passage. The complete Gause (1934) Chapter V was previously read for the ecology review; it documents both exclusion and coexistence depending on resource use, rather than an exceptionless slogan. Hardin explicitly says the competitive-exclusion name was already introduced; changed the credit from “the name” to advocacy in this review.

Closed mathbio-3.17 after correcting its strict-invasion argument at exact equality, the unconditional resource-count generalization, and the claim that more resources than species automatically falsifies exclusion. Exact identical species have a neutral continuum. A finite 60-unit preview is not evidence of eventual extinction. The green area formerly shaded the pointwise minimum of two Gaussians, while the displayed coefficient was their normalized inner product; the picture now shades the normalized product, whose integral really equals exp(−d²/4). A new independent quadrature test verifies five separations; ODE runs verify exclusion versus neutral equality.

## Negative-binomial attack follow-up

Read the complete original [May (1978), Host-Parasitoid Systems in Patchy Environments, pp. 833–844](https://sites.ifi.unicamp.br/aguiar/files/2014/10/RobertMay-1978.pdf), including all three mathematical appendices. The cover incorrectly lists the running page range as 833–843, but the complete scan includes p. 844. Visually checked original Eqs. (3)–(6) on p. 838 and Appendix 2 Eqs. (2.1)–(2.9) on pp. 843–844. Source DOI:10.2307/3674.

Closed mathbio-2.14. The local attracting threshold is exactly k<1 for every λ>1, rather than merely a wide numerical range. The paper distinguishes the analytic local proof from numerical large-disturbance evidence. At k=1 the multipliers have unit modulus, so a strict linear stability test does not establish nonlinear instability; the visualization now marks this boundary separately. Replaced its finite-difference equilibrium matrix with the exact matrix and a cancellation-resistant determinant, avoiding numerical misclassification at equality. The rescaling of a and c is explicit. Independent finite differences verify all four matrix entries over 24 λ/k combinations, equilibrium identities and all three Jury inequalities; the exact equality and Poisson limit are also checked.

## Remaining dynamical-theorem review

Reviewed mathbio-3.7 and 3.12 statements and complete visualization implementations. Both perturbation Jacobians in 3.7 agree algebraically with the displayed trace/determinant for 0<ε≤0.4. Corrected the claim that every perturbation destroys the centre, the claim that mere isolation guarantees persistence of a cycle, and the unsupported claim of a distant cycle/extinction in the saturation example. In 3.12 the Brusselator equilibrium/Jacobian indeed gives trace b−2, determinant 1 and nonzero crossing speed; corrected the local subcritical theorem’s alleged guarantee of a jump to a distant attractor. Full original Andronov–Pontryagin1937 and Hopf1942 sources have not been located, and a complete modern source for the cubic/nondegeneracy and supercritical claim is still required. Both flags remain.

Reviewed the entire mathbio-3.14 finite-grid checklist and all five rate functions. Its caption incorrectly said all first three models pass: type III has F(0,P)=1 for every P, so it lacks the finite predator-axis root. Classical LV violates the finite prey carrying-capacity root, whereas G_P=0 is explicitly permitted by the displayed ≤ condition. Corrected these explanations and changed “all hypotheses hold” to the actual limited sampled-grid outcome. Type I does not have the claimed Hopf transition over these parameters. The exact global theorem and whether this recalled inequality list suffices still require the full original or a complete authoritative mathematical account; flag retained.

Final completed browser evidence is 10 theme checks, all passed: the four earlier source items and May’s real k=1 button plus pointer drags across both stability regions.

## Chemostat follow-up

Read the complete original [Hsu, Hubbell & Waltman (1977), SIAM J. Appl. Math. 32:366–383](https://www.math.nthu.edu.tw/~sbhsu/SIAP77.pdf), all 18 pages, including model assumptions, Theorems 3.2–3.5, full comparison/omega-limit proofs and discussion. Visually checked original pp. 368–370, particularly hypothesis Hn, the winner limits, equal-break-even alternative and exact nutrient-plus-biomass mass identity. Theorem 3.5’s p. 369 printed nutrient limit contains an apparent S^(0)/S* typo: its positive biomass balance on p. 370 and proof on p. 380 give the correct limit S*. The visualization follows that mass balance.

Closed mathbio-3.20. Corrected the proof description, which incorrectly called the original comparison argument a Lyapunov proof. The full original explicitly treats exact ties; the controls can attain the strain-2/4 tie at D=.4, but the old readout arbitrarily named one winner and called the largest finite-time density a survivor. It now reports ties and the actual finite-time observable. Removed unverified Tilman-date and Hansen–Hubbell experiment asides from this mathematical theorem rather than presenting an unsupported experimental claim; the full original supports its current scope. Extended the nutrient plot to the actual feed range so the 4.8 break-even point at D=.8/feed5 is visible. Removed the integrator’s artificial positive biomass floor; only the log display has a floor.

Physically meaningful positivity assumptions are explicit for 3.19, whose one-strain equations and washout conclusion are also supported by this full source. Its original device/Monod history sources remain open; Europe PMC’s Novick1950 full PDF returned 403. The seventh independent group checks exact time-dependent total mass at five dilution rates, positivity, exact tie and washout classification, and long-run exclusion independently of the readout.

Also removed mathbio-4.13’s obsolete dependency on fa-9.13 after that theorem was corrected to the homogeneous renewal equation’s uniqueness result. Its renewal-limit explanation now names the key renewal theorem and the related Blackwell limit in stoch-11.3.

Browser evidence now has 14 completed theme checks (all passed), including the separate four chemostat cases. The eighth independent group covers primitive/periodic/reducible Leslie patterns and finite extinction without undefined normalized projections. Additional 4.4 browser checks are pending the coordinated map-performance quiet window.

## Stable-age follow-up

Read the complete original [Lotka (1922), The Stability of the Normal Age Distribution, PNAS 8:339–345](https://archive.org/details/sim_proceedings-of-the-national-academy-of-sciences-usa_1922-11-15_8_11/page/n22/mode/1up), all seven pages, including the variable-fertility limitations and final footnotes. Visually checked original Eqs. (3)–(4) on p. 340 and the caveats on p. 344. A complete seven-page excerpt is `/tmp/mathbio-primary/lotka1922.pdf`, extracted from the complete library issue. This is continuous-age history; the modern matrix statement is identified as a separately proved Perron–Frobenius consequence.

Closed mathbio-4.4. Added the missing positive-survival restriction to the Leslie primitivity criterion. The controls permit F3=F4=0, where all populations die within four steps and normalization formerly divided by zero. They also permit F4=0, where reducibility invalidates the all-starts conclusion. Normalized projection now returns an explicit extinct state and normalizes at every step to avoid over/underflow; the plot stops an extinct trace. The readout uses exact graph irreducibility/period rather than a floating spectral-gap threshold as a surrogate for primitivity. Independent tests and both-theme actual sliders cover primitive, period-4, reducible and nilpotent endpoints.

Reviewed the complete mathbio-3.8 simulation and response/risk formulas: type-II half saturation and type-III risk maximum follow algebraically, while simulated points are finite-window random encounter models. Clarified type-dependent units of a and the type-I count cap. Its source flag remains because the cited complete disc original still has not been retrieved; the separate sawfly paper is not substituted for it.

## Loggerhead sensitivity follow-up

Read complete relevant original sections of [Crouse, Crowder & Caswell (1987), Ecology 68:1412–1423](https://ecology-2023.gklab.org/pdf/Crouse_Ecology_1987.pdf): stage-model assumptions, demographic inputs, matrix construction, projection/sensitivity analysis and management scenarios, pp. 1412–1419, plus the model limitations pp. 1419–1420. Visually checked original Table 4/5 p. 1416 and sensitivity equation/Fig. 1 on p. 1417. All 49 matrix entries agree with Table 4, and computed λ=.94503098 and normalized eigenvectors match its reported values. This is a preliminary historical model, not a claim about current loggerhead measurements.

Read the complete §3.3, pp. 36–39, of [Caswell (2019), Sensitivity Analysis: Matrix Methods in Demography and Ecology, chapter 3](https://link.springer.com/content/pdf/10.1007/978-3-030-10534-1_3.pdf), including the author’s derivation, age-classified special case, coupled lower-level parameters and historical account. It explicitly identifies the 1978 population application and explains that the underlying eigenvalue-perturbation formula is much older. This is a complete authoritative original-author account, not a claim that the 1978 paper itself was retrieved.

Closed mathbio-4.10. Corrected the false statement that structural zeros cannot have meaningful sensitivity. Clarified that the interactive proportional P/G control differs from the original’s alternative annual-survival/stage-duration recalculation. Corrected the claim that *any* later stage is more responsive than eggs: novice and first-year remigrant survival elasticities are smaller, while stages 2–4 and 7 have the larger effects. The ninth independent math group checks the full original matrix, published λ/eigenvector values, central differences including a zero entry, elasticity sum, the exact fecundity/hatchling-survival equality, and the actual stage-5/6 ranking.

Completed mathbio browser evidence now contains 18 passed theme groups, including all stable-age endpoints and turtle sensitivity endpoints; source math suite: nine groups passed.

## Disc and original chemostat sources retrieved

The earlier Cambridge abstract/login responses are superseded by complete original journal scans. Read all 14 pages of [Holling (1959), Some Characteristics of Simple Types of Predation and Parasitism, pp. 385–398](https://archive.org/details/sim_canadian-entomologist_1959-07_91_7/page/n2/mode/1up), including both disc protocols, Eqs. (1)–(10), identification-time caveat, natural parasitoid comparisons and final discussion. Visually checked original protocol p. 385 and Eq. (4)/Fig. 1 on p. 386. The touch experiment used 4-cm discs on a 3-ft-square table for one minute, eight replicates per density. The second used pencil taps/sound. Discs were removed: constant prey density in the teaching formula is an approximation, now explicit. Types I/quadratic III are conventional parameterizations, not falsely described as equations fitted by that paper. Completed handling events now determine simulated intake, preventing an unfinished final handling event from being counted as consumed prey. Independent time-budget tests cover that endpoint, saturation and the risk maximum.

Read the complete two-page original [Novick & Szilard (1950), Description of the Chemostat, Science 112:715–716](https://archive.org/details/sim_science_1950-12-15_112_2920/page/n20/mode/1up), including the complete device/pressure-regulator explanation and original Fig. 1, with both pages visually inspected. It describes nutrient-limited stationary growth balancing w/V and the apparatus, rather than explicitly giving the modern Monod ODE. The item now separates that original device source from the current equations proved in the full Hsu1977 source and narrows the unverified Monod1950 historical date to Monod-type kinetics without an origin-year claim. This completes 3.19’s source gap.

Both complete original excerpts are `/tmp/mathbio-primary/holling-disc-original.pdf` and `/tmp/mathbio-primary/novick1950-original.pdf`. Keyfitz1971’s exact issue was found, but its full PDF/OCR endpoints return 403; this is not recorded as a full source reading.

## Momentum and age-PDE review

Reviewed the entire mathbio-4.12 implementation and its initial/stationary matrices. Added the spectral assumption required for the projection formula and qualified the >1 claim: the formula alone does not prove positive momentum for every arbitrary replacement schedule; the controls use a specified proportional fertility reduction and unchanged survival. The no-change R0=1 endpoint has M=1. The unchanged-fertility counterfactual leaves the plotted range at high fertility and is now explicitly labeled. Independent long-run matrix powers at three initial R0 values agree with the reproductive-value projection. Keyfitz1971’s exact IA issue metadata is available, but full PDF and OCR both return403. No full original reading is claimed; flag retained.

Reviewed the entire mathbio-4.14 numerical model. The former newborn boundary used a right-hand sum while the stated Euler–Lotka root used trapezoidal weights; these were different discrete models. The boundary now uses the same trapezoidal rule, including the implicit age-zero contribution, and the integral used for normalization is consistent. The scheme is a characteristic shift with midpoint survival, not a generic diffusive upwind step. Added the actual age-12 truncation, possible initial-boundary corner incompatibility and needed renewal-asymptotic restrictions. An independent stable-eigenmode test verifies exact e^(rh) growth of the grid profile at three fertility levels, as well as the newborn integral, positivity and pure-death characteristic shift. Full originals by McKendrick1926 and vonFoerster1959 have not been retrieved, and their exact historical formulations still require checking, so the flag remains.

Every initial mathbio source flag has now received an item/model/source-gap review. Five remain for explicit evidence gaps (3.7, 3.12, 3.14, 4.12, 4.14); there are no genuinely unreviewed initial mathbio flags.

Final validation: twelve independent mathematical test groups and 24 unique real-control light/dark browser groups passed; source-blocked text-only structural-stability/Hopf/checklist reviews remain explicitly flagged. All fifteen initial flags have an actual item review. Keyfitz1971 exact Internet Archive issue exists but complete PDF/OCR access returned403; this did not close the original-source gap. Combined physiology/pharmacology/mathbio static check covers167 items with zero errors or warnings.

## Cross-field peer follow-up

The separately authorized known mathematical/scope corrections are documented in [peer-corrections.md](peer-corrections.md), with independent math and both-theme native evidence. This follow-up does not close any source flag.
