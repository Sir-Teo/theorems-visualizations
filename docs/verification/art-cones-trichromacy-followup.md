# Art 4.1/4.2: cone fundamentals and trichromacy source follow-up

The two pages now use the same official CIE 2006 2° **energy** cone table and one explicit primary-response matrix. The old Hunt–Pointer–Estevez transform of a CIE 1931 analytic fit was not the stated cone dataset, and the old matching widget combined that basis with a different RGB matrix. Both source flags are resolved after independent root acceptance. No neighboring object, chapter summary, shared helper/runtime, central ledger, generated data or build configuration is changed.

## Actual sources and reading scope

Source cache: `/tmp/atlas-art-cones-sources/`. Hashes below are SHA256 of actual acquired bytes, not metadata-only lookups.

| Actual source | Local file, bytes and SHA256 | Reading/use |
|---|---|---|
| [CIE 2006 2° energy dataset](https://cie.co.at/datatable/cie-2006-lms-cone-fundamentals-2-field-size-terms-energy), DOI 10.25039/CIE.DS.tijidesg | `CIE_lms_cf_2deg.csv`,3182; `f48160edf11c1a121aaaf41d4c3b7513385bfc9c60d726b88e735519f6d37b1f` | All 89 rows, all four columns; actual data are copied exactly into the isolated JS representation. |
| [Official metadata](https://files.cie.co.at/Publications-datasets/CIE_lms_cf_2deg.csv_metadata.json) | `CIE_lms_cf_2deg.csv_metadata.json`,3224; `c488310e9f076a9e00bff69d206eae8821bd17137e6a3ba260570eae4ff91fab` | Complete metadata: Table 6.7 provenance, published MD5/SHA256, column sums, row32, units,5nm sampling, linear interpolation, zero extrapolation, S last wavelength615nm, approximated data quality, CC BY-SA4.0. The full CIE 170-1 report was not acquired or claimed read. |
| [CIE 2015 cone-based 2° XYZ_F data](https://cie.co.at/datatable/cie-cone-fundamental-based-spectral-tristimulus-values-2-degree-field-size), DOI 10.25039/CIE.DS.548rw69q | `CIE_cfb_stv_2deg.csv`,17039; `a10751ec8aecdb023f16ba079557e7fb794806884fe3da982dd63da285f872a9` | All 441 rows loaded/validated; all 89 shared 5 nm rows retained solely as an independent matrix-consistency fixture, not production spectral data. |
| [Its official metadata](https://files.cie.co.at/Publications-datasets/CIE_cfb_stv_2deg.csv_metadata.json) | `CIE_cfb_stv_2deg.csv_metadata.json`,3369; `24eb42e00e0b6dc3f6b60fcaae1bd5ea2d9195e6da28ff69b801cf475c80cb7a` | Complete metadata, checksums, column sums/sample row and formula/interpolation convention. |
| Stockman & Sharpe, *The spectral sensitivities of the middle- and long-wavelength-sensitive cones derived from measurements in observers of known genotype*, Vision Research 40(2000) 1711–1737, [actual published PDF](https://www.haralick.org/DV/spectral_sensitivities_of_cones.pdf), DOI 10.1016/S0042-6989(00)00021-3 | `stockman-sharpe2000.pdf`,901208; `7ef7a10d11f7d51305efb49dcabd68d547caab6548915254c4d58cc8345d8069` | Read introduction and complete§§1.1–1.2, PDF 1–4/printed 1711–1714; negative primary convention, cone equations1–3, separate arbitrary cone scales, equal-energy versus quantal units. Actual rendered PDF 3/4 formula pages inspected as `stockman-sharpe2000-page3.png` and `...page4.png`. Not a claim to read the remaining27-page article. |
| Stockman & Rider, *Formulae for generating standard and individual human cone spectral sensitivities*, Color Research & Application 48(6)(2023) 818–840, [publisher full text](https://onlinelibrary.wiley.com/doi/full/10.1002/col.22879), [actual full publisher JATS XML through EuropePMC](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10946592/fullTextXML) | `stockman-rider2023.xml`,272472; `d1cbdad8e9dbeca95468b39d99bfa77c0e3f2665db3f057f0f77786c79636410` | Read§1/§1.1,§2.3 Eqs7–8 and complete§§6–7/Eqs10–15 through the matching-space transformations, including actual MathML. Used univariance, ocular filtering/observer qualifications, energy versus quantal conversion, symmetric matching and primary matrix/sign convention, Eq14. No 2023 PDF or article-figure image acquired or claimed inspected. Its new fitted/extrapolated cone functions are **not** used. |
| [W3C CSS Color4,9October2026 CR draft](https://www.w3.org/TR/2026/CRD-css-color-4-20261009/) | `css-color4-20261009.html`,1048849; `2174f6360440f9820b30934368308a68bd514160f86621476b83eb2004c2c63f` | Actually read sample-code `XYZ_to_lin_sRGB` and `gam_sRGB`: matrix and transfer constants only. Our channel-lift/scale map is explicitly authored, not the W3C gamut-mapping algorithm. |

The actual CIE CSV downloads use `https://files.cie.co.at/Publications-datasets/CIE_lms_cf_2deg.csv` and the corresponding `CIE_cfb_stv_2deg.csv` path. Root-level filename aliases returned404 and are not the acquired source. The LMS MD5 is `dba2e9d1f5e6667575aa069832159510`; XYZ_F MD5 is `472cc50b14a6cf41ba9f08f8935aedc8`. Data and adapted validation subsets retain explicit CIE attribution and CC BY-SA4.0 notices.

The canonical energy table is distinct from Stockman–Sharpe2000's own **quantal** Table 2. The later author's fitted/extrapolated360–850nm curves also differ from the exact CIE 5 nm table used here. Neither is silently substituted for the dataset.

## Mathematical and model changes

**4.1.** The sensitivities are the actual source values, independently normalized by cone class. They do not encode cone counts or absolute inter-class gains. For an energy SPD, each signal is its integral against the respective energy-based fundamental. The source has L/M 390–830nm and S 390–615nm. All 43 missing S cells stay `null` in the data representation; the numerical S function zero-extends after 615nm. This is a stated dataset convention, not a biological assertion of zero sensitivity. At615nm the plotted S curve drops vertically, avoiding a fabricated triangular tail to 620nm.

The widget's Gaussian spectra, equal-energy light and2856K Planck spectrum are authored stimuli. The Gaussian FWHM is defined before restriction to the source band. Black-body power is normalized at 830nm; it is not a measured lamp or a claim to implement CIE illuminantA. Zero intensity gives exactly zero signals and an undefined L/M ratio. Curves overlap; a ratio is not an arbitrary-spectrum hue estimator. The three bars divide by the corresponding unit equal-energy integral, so that reference is exactly(1,1,1).

Numerical integration is composite Simpson quadrature at 0.5nm, separately bounded for each cone, with every5nm source knot on a panel boundary. The independent equal-energy trapezoidal integrals are approximately(115.97867935935545,94.82092794802486,58.41620943394244). Source **sample** maxima are L 570nm,M 545nm,S 445nm; these are not asserted continuous peaks. Eleven independent analytic Gaussian integral triples agree within3.77×10⁻⁷ absolute raw-signal units. The independent polynomial primitive check also verifies exactness for a piecewise-cubic integrand on the aligned source segments.

**4.2.** Authored ideal spectral-line primaries at 540, 610, 450 nm all use that same energy table and unit integrated radiant power. Their response matrix, in green/red/blue column order, is

```
P = [[.8810083,   .7057161,    .04986433],
     [.9952221,   .2052721,    .08705225],
     [.005088971, .000008034895,.9553885]]
det(P) = −.4979727047311528.
```

Consequently three columns are independent. The actual written `ladr-2.28` basis criterion establishes unique real coefficients for any model triple. A negative coefficient is physically moved to the test side. One/two columns span a line/plane: they cannot match arbitrary triples, but they can match special targets. The “Test first primary” button exposes that exception; the omitted-blue target supplies a counterexample. The old assertion that fewer primaries never match was removed.

The target is `(1−w)c(lambda)+w*e`, where `e` is the source equal-energy integral divided by 440nm, so both components represent one unit of integrated radiant power. The pure helper computes unconstrained signed least squares via QR for the active columns. A reported LMS Euclidean residual has a declared coordinate scale and is **not** a perceptual/JND criterion. No arbitrary 0.5% threshold declares a match.

Every offered wavelength is integer400…700. Each solution is affine in `w`, so enumerating both endpoints at all 301 wavelengths proves the bounds for the entire `w∈[0,1]` continuum. All 1/2/3-column coefficients have absolute value below 1.04; controls offer±2. No computed solution is clipped. Every manual±2 corner also preserves the exact physical-side identity `left−right=target−P*a`, and all plot ranges include both complete sides.

Patches use Stockman–Rider Eq14 to obtain cone-based XYZ_F, followed by the cited sRGB-style matrix/transfer under a shared exposure and an authored channel-lift/scale gamut map. The public scope explicitly distinguishes the XYZ_F observer from the 1931 XYZ underlying sRGB, and explains that screen patches are illustrative. LMS bars/residuals remain authoritative. At the89 shared source wavelengths, the separate official CIE 2015 XYZ_F values differ from this matrix applied to the official CIE 5 nm LMS table by at most3.13685×10⁻⁵ absolute. This measured discrepancy is retained and tested; no exact published-table identity or particular explanation for the discrepancy is asserted.

## Actual prerequisites and runtime domains

Read the actual written `art-3.2` spectrum statement/idea/caption/scope;4.1 retains that genuine input. Read `ladr-2.28` statement/idea/caption/dependencies in full;4.2 now explicitly uses it for the column-basis argument. Also inspected actual `ladr-3.59` and `ladr-3.76`, but added neither because they are not needed separately. No planned dependency or quota link is introduced.

Wavelengths and Gaussian widths have integer controls and matching integer model/state validation. Continuous intensity, white fraction and signed amounts use `step='any'`; this matters because generic runtime replay accepts any finite in-range value. A fixed HTML step would sanitize the thumb while leaving a separate exact model value unchanged. Final native checks explicitly restore intensity`.123456789`, white fraction`.137` and fractional signed amounts through actual snapshot/destroy/remount. Actual input strings are compared exactly with an independent fresh detached range input configured with the same declared min/max/step and assigned String(model). This tests the browser serialization operation directly; separate assertions enforce step=any for continuous controls and the exact integer domains. Formatted outputs/ARIA text are also checked. Saved model/control values themselves round-trip exactly. The earlier fixed-eight-EPS comparator is superseded for the reason below. Out-of-domain/fractional integer state falls back to clean defaults rather than reaching the model.

## Reproduction and validation

```
node --test tests/verification-art-cones.test.mjs
python3 tests/verification-art-cones-sources.py /tmp/atlas-art-cones-sources
node scripts/check.mjs art-4.1 art-4.2 --static
node tests/verification-art-cones.mjs
```

The Python source check uses only the standard library and the actual downloaded CSV/metadata files. It checks both published hashes, metadata sums/sample rows, all 89 LMS rows/all 441 XYZ rows and all 89 extracted XYZ fixture rows. Its Gaussian references integrate each source-linear segment with analytic erf/erfc primitives; they do not call production quadrature. Default Node tests compare every adapted LMS cell/null to the exact checksum-verified original bytes, verify the independent fixtures, use scalar normal equations/Cramer's rule instead of production QR, test all 301 wavelengths and white endpoint/mixture values, every signed amount corner, full physical-side identities, finite display conversions and malformed numerical inputs.

Math: **5/5 pass**. Source extraction: **pass**. Scoped static: **2 items,0 errors,0 warnings**. Native: **all8 full page/theme/width groups pass**, plus all4 final4.2 groups repeated after the scientific-notation repair, all4 zero/subnormal-state groups after the4.1 status wording repair, and4 narrow exact-state groups (both pages/both themes). A final430px light zero/subnormal group also passes the tightened numeric input comparison. All browser/server processes exited.

The native script covers each page in light/dark at 1450/430px, actual buttons/selects/sliders, every offered spectral family and control corner, all cone products, zero light, S cutoff, all 1/2/3-primary spans, special-target buttons, least-squares solves and arbitrary manual corners. It checks entire actual path samples and rectangle/stroke bounds, all canvas text/halos, TeX/page overflow, input/model/output agreement, real keyboard endpoints, exact saved-state remounts including hidden controls, and malformed-state fallback.

## Narrow scope guard and frozen handoff

Scope guard compares the chapter to `/tmp/atlas-art-cones-chapter-before.js`: exact prefix except the isolated import and exact suffix from4.3 onward. The complete chapter summary and4.3–4.8 objects are unchanged. A matching guard against `/tmp/atlas-art-cones-syllabus-before.js` preserves every byte outside the two4.1/4.2 rows, including the syllabus summary. No accepted chapter3, psychology, jury or game path is edited.

Owned paths are the two public source files, isolated cone data/helper, reference fixture, source-extraction check, mathematical/native tests and this report. Exact final hashes, source-cache hashes and screenshot paths are in `/tmp/atlas-art-cones-manifest.json`. Both source flags stayed true for the root review recorded below. No user approval or listening gate is introduced; this report describes agent verification only.


## Final evidence and inspected pictures

Full native logs are `/tmp/atlas-art-cones-native-final.log` (8 groups) and `/tmp/atlas-art-cones-native-final-readout.log` (4 final4.2 groups). The latter reruns the complete4.2 control/model/geometry/state family after the raw scientific-notation TeX found during screenshot inspection was correctly math-delimited. The native script now rejects raw TeX outside rendered formulas. The4.1 function/helper/geometry were unchanged by that4.2 repair.

The last4.1 change was the readout-only wording “The computed L/M ratio is undefined (zero computed M signal).” A minimum-positive accepted intensity can underflow the computed M signal even though intensity is nonzero; the earlier “At zero intensity” wording was therefore too specific. `/tmp/atlas-art-cones-native-final-zero.log` records all4 theme/width combinations with all4 spectrum modes, each at zero, `Number.MIN_VALUE` and`1e-300`, through actual controls and snapshot/remount. `/tmp/atlas-art-cones-native-final-zero-strict.log` repeats the430px light group after strengthening the browser numeric comparison. Model/data/curves/integration are unchanged.

`/tmp/atlas-art-cones-native-final-exact-state.log` records4 additional430px groups (both pages/both themes) exercising fractional intensity/white/amounts and exact saved-state restoration. An intentionally stricter attempted **bit-for-bit input/model equality** failed at a solved coefficient: Chrome serializes`.7462935869649628` as`.746293586964963`. The failed attempt is retained at `/tmp/atlas-art-cones-native-bit-equality-attempt.log`; production was not rounded or changed. Final native checks allow only browser numeric serialization roundoff, preserve zero/nonzero explicitly, and still require exact saved model/state equality. This is separate from a stepped-thumb mismatch of substantive size.

Math/source/static logs: `/tmp/atlas-art-cones-math.log`, `/tmp/atlas-art-cones-source-extraction.log`, `/tmp/atlas-art-cones-static.log`. Narrow scope guards passed against both original backups; their final output is `/tmp/atlas-art-cones-scope.log`.

Actually inspected complete page images include:

- `/tmp/atlas-art-cones-4.1-default-1450-light.png`
- `/tmp/atlas-art-cones-4.1-default-1450-dark.png`
- `/tmp/atlas-art-cones-4.1-default-430-light.png`
- `/tmp/atlas-art-cones-4.1-equal-energy-430-dark.png`
- `/tmp/atlas-art-cones-4.1-S-cutoff-430-light.png`
- `/tmp/atlas-art-cones-4.2-default-1450-light.png`
- `/tmp/atlas-art-cones-4.2-negative-solution-1450-dark.png`
- `/tmp/atlas-art-cones-4.2-negative-solution-430-light.png`
- `/tmp/atlas-art-cones-4.2-blue-2-430-dark.png`
- `/tmp/atlas-art-cones-4.2-amount-corner-430-dark.png`

Inspection checked chart/label/control/readout legibility, actual source curves, zero/reference/bar behavior, the physical two-side panels, signed amounts and the corrected scientific notation. Dedicated panel crops and additional full-page scenarios for all8 combinations are listed in the manifest. No human-perception, calibrated colour-match or human review claim is made.

Additional targeted reproduction commands:

```
node tests/verification-art-cones.mjs 4.2
ATLAS_ART_STATE_ONLY=1 node tests/verification-art-cones.mjs '' '' 430
ATLAS_ART_ZERO_ONLY=1 node tests/verification-art-cones.mjs 4.1
```


## Parent-review repair:320px equation and exact browser serialization oracle

The parent independently reproduced two failures, whose original logs are preserved unchanged: `/tmp/atlas-root-art-cones-native.log` and `/tmp/atlas-root-art-cones-320.log`. At320px the4.1 display combining the whole integral with the qualifier i=L,M,S overflowed. The only production change is splitting that qualifier out of the display into a short inline sentence. The integral/formula, helper, data and all4.2 mathematics remain unchanged. Its regenerated320px full page was inspected.

The other failure exposed an invalid **test assumption**, not a coefficient/model error. For lambda400,white0,n2, red model coefficient`−0.00011113856243963323` becomes DOM range string`−0.000111138562439633`, with step`any`. This15-significant-digit browser serialization differs by about2.3e−19, exceeding the former fixed8EPS relative bound. The detailed independent reproduction is preserved in `/tmp/atlas-art-cones-input-diagnostic.log`; the earlier failed bit-equality attempt is also retained.

The corrected assertion does not widen a numerical tolerance or round production coefficients. It creates a **fresh detached range input**, copies only the declared min/max/step, assigns`String(model)` and requires exact equality between that independent browser serialization and the actual input string. Integer controls separately require exact integer/model identity; continuous controls separately require the declared step`any`. Snapshots and model/control values still require exact restoration. This distinguishes browser serialization from a stepped-thumb quantization error without changing the mathematical model.

Per the parent's bounded rerun request, both full groups now pass with the corrected assertion: art4.2/light/1450px (`/tmp/atlas-art-cones-parent-fix-match1450.log`) and art4.1/light/320px (`/tmp/atlas-art-cones-parent-fix-cones320.log`). The default native width matrix now includes1450/430/320, preserving the parent's added narrow-only switch. The entire12-group independent matrix is for the parent to rerun; no pass for that pending matrix is claimed here. New math/static/scope checks remain clean. The updated frozen manifest retains all9 paths and records exactly which3 changed: chapter equation, native test and report. No model helper/data/fixture, syllabus or adjacent object changed in this repair.

## Independent root acceptance

Root read the complete two items, pure model, data and tests; the actual art3.2 spectrum and ladr2.28 basis arguments; both complete CIE metadata records and exact adapted rows; Stockman–Sharpe introduction/§§1.1–1.2 and actual PDF3/4 formula images; Stockman–Rider §1/1.1, complete§2.3,§§6–7 and the actual MathML; and the actual W3C sample matrix/transfer functions. All seven original-source identities and nine frozen author paths match. Root's source validator independently reproduces both exact source tables and analytic Gaussian references. No unread CIE report or2023 figure/PDF is claimed.

Root's five mathematical groups, source-data validation and static2/0/0 pass. After preserving both initial native failures and the precise serialization diagnosis, root ran the entire final **12 full native groups**, **12 targeted exact-state groups** and **6 zero/subnormal groups**, all with exit0. These cover both items at1450/430/320 in both themes, with zero cases scoped to4.1. Final logs are `/tmp/atlas-root-art-cones-final-{native,state,zero}.log`; unchanged model/source evidence remains `/tmp/atlas-root-art-cones-{math,sources,static}.log`.

Root inspected final320-light complete integral and negative-primary pages,430-dark equal-energy page, and1450-dark signed solution, including formulas, tiny scientific residuals, physical matching sides and complete markers/bars. Exact guards preserve the chapter summary, all4.3–4.8 bytes, and every syllabus byte outside the two matching rows. The model makes no calibrated display or perceptual-threshold claim. Both flags are cleared and queue/plan counts reconciled in this acceptance commit. A separately identified4.3 threshold/source uncertainty will be tracked independently; it does not change this two-item acceptance.
