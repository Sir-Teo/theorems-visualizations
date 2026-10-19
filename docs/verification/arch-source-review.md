# Architecture chapters 3–4: source review, 18 October 2026

This review closes arch-4.6 and preserves ten source flags. Calculations and controls were corrected where independent checks exposed errors; a corrected illustrative model alone does not close an unresolved historical claim. The shared `arch/ch03.shared.js` linear-program API was preserved.

## Original evidence read

- [Nikolić (2016), A Note on Milankovitch's Theory for Determination of Thrust Line in Gothic Arches, complete seven-page paper](https://www.gf.uns.ac.rs/~zbornik/doc/NS2016.018.pdf): radial joints, centroid eccentricity and force construction.
- [Nikolić (2016), Graphical Simulation of Minimum Thickness of Clamped Pointed Arch, complete twelve-page paper](https://www.gf.uns.ac.rs/~zbornik/doc/NS2016.019.pdf): minimum-thickness construction and Table 2, original p. 207, visually checked. All nine zero-eccentricity table values used by the visualization agree with the original. This is primary evidence for that calculation, not a reading of Couplet or Milankovitch's earlier originals.
- [Heyman (1966), The stone skeleton, complete original-paper text transcription](https://pdfcoffee.com/the-stone-skeleton-2-pdf-free.html), DOI 10.1016/0020-7683(66)90018-7: all relevant prose on assumptions and Kooharian's priority, pp. 252–254; arches, pp. 256–259; buttresses, pp. 260–265; Poleni, pp. 267–269; groin and rib vaults, pp. 269–276; Reims example, pp. 277–278. The transcription contains captions but damaged equations and does not supply usable original figures. That limitation is retained explicitly; this is not recorded as a full visual inspection of the paper. Its groin-vault half-weight, 2.28wR², independently checks the corrected full area 4(π−2)R².
- [Poleni (1748), Memorie istoriche della gran cupola del tempio vaticano, ETH original](https://doi.org/10.3931/e-rara-13403): complete relevant Book I §§73–89 (pp. 40–50), Book IV §§583–596 (pp. 417–422), and Book V §§658–669 (pp. 453–458), read in the original Italian OCR. Visually inspected the original Plate E, Fig. XIV, and weight table on pp. 47–48 through the library's IIIF images. §§83–88 explicitly describe 50 idealized sectors made by 25 planes, 16 weighted links on each side, lantern loading, and the weighted chain within the masonry. §595 dates the first five new hoops to 1743–44; §§660–665 date the sixth to September 1748. §659 describes the dome's self-strength despite broken earlier hoops. The entire unrelated remainder of the book was not read.
- [Opera di Santa Maria del Fiore, Dome, complete custodian page](https://duomo.firenze.it/en/40/dome), and [archive-based completion account, complete page](https://duomo.firenze.it/en/opera-magazine/post/4649/on-30-august-1436-the-work-on-brunelleschi-s-dome-was-completed): interior diameter 45.5 m, exterior 55 m, double shell, herringbone, meridian and parallel ribs, and work from 7 August 1420 to 30 August 1436. These establish basic building facts, not the numerical model's assumed profile or the historical chain capacities.
- [Italian Ministry of Culture, Pantheon historical background, complete custodian page](https://direzionemuseiroma.cultura.gov.it/en/pantheon/historical-background/): internal diameter and height 43.30 m, oculus approximately 9 m, Hadrianic reconstruction dated 118–125. The retained competing construction dates and detailed material/thickness profiles still require their own primary survey evidence.

Downloaded original text, scans and images are in `/tmp/arch-primary`. Heyman's publisher page did not expose a complete readable scan; its accessible transcription's figure/equation limitation remains open. The official Hagia Sophia brochure was located but its two PDF pages could not be fully read (HTTP 403 in the shell and no usable text/images through the web reader); search excerpts were not accepted as full-paper evidence.

## Corrections and outcomes

| Item | Outcome |
| --- | --- |
| arch-3.7 | Retained. Matched all nine original Nikolić table values. The control and plot now accommodate the 135° model minimum (approximately 0.537R) instead of clipping at 0.45R. A later viewport reset was also corrected. Restricted the 0.10748R convergence claim to the semicircle and qualified the structural interpretation. |
| arch-3.10 | Retained. Replaced sampled toe checks with the exact affine toe-moment threshold over the whole pier. Exposed the assumed 26 kN flyer dead load and other model geometry. Pinnacle controls and plot now cover the full computed threshold, including approximately 2575 kN at the extreme controls. |
| arch-3.14 | Retained. Corrected the historical claim that Heyman originated every theorem: he explicitly credits Kooharian (1953). The assumptions and modern safe-theorem interpretation are supported by the complete relevant prose, with the remaining scan limitation stated. |
| arch-4.1 | Retained. The former rendered surface used the lower cylinder envelope, a cloister vault. It now uses the upper envelope of crossing cylinders, with open edge arches. Re-derived groin area, strip weights and diagonal moments; corrected the barrel-vault lever arms. Clearly labels the plotted thrust as a vertical-load surrogate: it omits horizontal reactions of the web arches. A feasible surrogate line is not a full vault safety certificate. |
| arch-4.2 | Retained. Applies the same groin geometry and increasing strip-load law toward the springing. Removed unsupported claims that rib mass alone determines load sharing. The rib readout identifies the vertical-load model rather than claiming the complete structure stands. |
| arch-4.6 | Closed. Original text, weight table and plate checked. Corrected 50 sectors versus observed cracks, the 16 links, reinforcement dates and the modern interpretation versus Poleni's own claim. The model's diametral slice contains two gores: whole-shell weight is Wn/2, not Wn. Distinguishes the discrete ring force H/[2 sin(π/n)] from its continuum approximation nH/(2π). Hanging markers now have area proportional to weight. A failed numerical thrust search does not prove collapse, and the round-number profile is explicitly not Poleni's measured reconstruction. |
| arch-4.7 | Retained. Removed the incorrect claim that the oculus eliminates the heaviest crown material. The force plot now includes both curves over their full computed ranges; the former ±650 kN/m range clipped values above 1700. Dimensions have a custodian reference; measured material/thickness profiles remain open. |
| arch-4.8 | Retained. Corrected the historical interior diameter to the custodian's 45.5 m and explicitly keeps the numerical reconstruction's rounded 44 m span separate. The vertical plots accommodate all pointedness settings. Band-integrated membrane force is qualified as an illustrative net resultant rather than a validated force in the actual chains. |
| arch-4.9 | Retained. Re-derived the spherical-cap parametrization: it now meets the base ring even for the control's greater-than-hemisphere rise. Corrected the separate-cap area readout and identified its reference sphere. Removed the unrestricted claim that the transition can support any dome, and qualified the ring's compression/tension interpretation. |

## Evidence still needed

| Item | Specific gap |
| --- | --- |
| arch-3.7 | Complete Couplet and Milankovitch originals, including the claimed 0.1095R vertical-joint value and 54.5°/58.8° critical-angle history. Nikolić's complete modern table does not establish every earlier attribution. |
| arch-3.10 | Original historical account for the 1966–67 pinnacle attribution and evidence connecting the simplified load path and assumed dimensions to an actual building. |
| arch-3.12 | Complete Derand (1643) original, the stated proportional intervals, and Huerta's survey interpretation; the illustrative third-point construction is not independently certified as the historical rule. |
| arch-3.13 | Hooke's original 1676 publication and the 1705 deciphering account; primary evidence for the retained Galileo/1691/Gaudí history. |
| arch-3.14 | Original figure/equation scan inspection and the precise earlier Couplet attribution. The accessible full prose supports the assumptions and theorem but does not resolve those remaining parts. |
| arch-4.1 | Primary evidence for Roman-vault history and complete web-reaction transfer in a statically admissible three-dimensional solution. Current force curves explicitly omit web-arch horizontal reactions. |
| arch-4.2 | Primary Durham dating/development evidence and a complete coupled web–rib load-transfer model or measured survey supporting the structural sharing claims. |
| arch-4.7 | A primary survey of shell thickness, aggregate profile and construction chronology. The membrane approximation reduces a thick shell to an inner sphere and is not an assessment of the actual cracked dome. |
| arch-4.8 | Original evidence for the quinto-acuto construction, chain specifications and lantern chronology, plus the non-axisymmetric geometry/loading needed to turn an illustrative band resultant into an actual chain design force. |
| arch-4.9 | Primary evidence for the claimed Roman origin and Hagia Sophia's dimensions, original/rebuilt-dome chronology and architects. Independent spherical geometry does not establish building history or load capacity. |

## Reproducible checks

- `node --test tests/verification-arch-source.test.mjs`: eight independent groups. Tests use analytic area/moment integrals, endpoint-equilibrium bounds, a spherical closed form and original source-table values, rather than merely checking the same implementation twice.
- `node tests/verification-arch-source-browser.mjs`: eight changed visualizations in both light and dark themes, serial Chromium execution and real pinned KaTeX installed with `installBrowserAssets`. Exercises segmented controls, switches and extreme sliders; checks full graph ranges, whole-shell mass invariance, finite readouts, runtime errors and TeX errors.
- `node scripts/check.mjs arch --static`: all 40 items, zero errors or warnings.

Browser evidence is written to `/tmp/arch-source-verification-browser.json`; screenshots are in `/tmp/arch-source-verification-shots/`. These temporary artifacts are supplementary to the committed reproducible checks and this report.

## Bounded final acquisition

A new public-source pass on arch-3.14 did not yield its full original. Its source flag and precise missing-evidence record remain. New routes and their limits are recorded in [geology-bounded-source-followup.md](geology-bounded-source-followup.md).
