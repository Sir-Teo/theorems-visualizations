# Geology chapters 3–4: source verification, 18 October 2026

Scope: all 21 existing source flags in chapters 3 and 4 of the current cloud checkout. Two flags are closed; 19 remain explicit. This review does not certify the remaining source-dependent claims simply because the mathematics renders.

## Primary evidence read

- [Vine & Matthews (1963), Nature 199, 947–949](https://courses.washington.edu/ess502/Vine_Matthews.pdf): complete three-page scan visually read, including Figs. 1–4 and the final discussion. The scan has no useful text layer; extracted text alone is insufficient.
- [Parsons & Sclater (1977), JGR 82, 803–827](https://topex.ucsd.edu/geodynamics/parsons_sclater77.pdf): complete relevant model derivation (§2, pp. 804–807), empirical fit domains on p. 803, discussion on pp. 820–823, and Appendix 1 on pp. 823–824 read. Eq. (7) gives the half-space limit, (8)–(11) the flux and isostatic elevation, and (24) the plate sine series. Their vertical coordinate is measured upward from the base; the implementation measures depth downward from the surface.
- [Pollack, Hurter & Johnson (1993), Reviews of Geophysics 31, 267–280](https://ihfc-iugg.org/internal/internal-downloads/Pollack_etal._1993_AnalysisHeatFlow.pdf): relevant complete acquisition, ocean correction, global totals sections (pp. 267–273) and geotherm discussion (pp. 276–278) read. Estimates include hydrothermal corrections; regional averages are not individual borehole measurements.
- [Hirschmann (2000), G-cubed, doi:10.1029/2000GC000070](https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2000GC000070): full article available; solidus-fit methodology (§3), Table 2, compositional limitations and conclusions inspected. A discrepancy between the abstract's quadratic coefficient −5.104 and the publisher's displayed Table 2 value −5.1404654 requires checking the original table/supplement before changing the model's coefficient. This item stays flagged.

Retrieved PDFs are temporary evidence in `/tmp/geol-primary`; source URLs and section identifiers above are the durable trail. A 131-slide teaching PDF containing one McKenzie–Parker page is not the complete 1967 original and was not accepted as closure evidence. Nature's original-paper PDF requests redirected to subscription/login pages. The Stein author-publications page returned HTTP 503; the Wegener scan returned HTTP 403; the Morgan scan returned HTTP 503. Search snippets and DOI metadata were not treated as complete readings.

- [WHOI Marine Magnetic Research, complete CK95.M table](https://website.whoi.edu/deeptow/research/jurassic-magnetism/jurassic-magnetism-1992-survey/the-geomagnetic-polarity-time-scale-gpts/table-of-ages-for-cande-and-kent-gpts/): authoritative research-group transcription of the historical 1995 calibration; every normal interval through 5.9 Ma checked. This is explicitly CK95, not a modern mixed GPTS.

- [Bullard, Everett & Smith (1965), full original scan](https://earthguide.ucsd.edu/eoc/eoc_teachers_hs_earth/content_tectonics/pdf/Bullard_fit.pdf): full text read (pp. 41–51), Table 1 visually inspected. The ENS mirror failed; UCSD supplied the full original including plates.

## Corrections and closures

| Item | Outcome and evidence |
| --- | --- |
| geol-4.1 | Closed. Primary global estimates and conductive-geotherm assumptions checked against Pollack et al. All conductivity values remain explicitly illustrative. Replaced the unsupported chapter-summary total with the attributed 1993 estimate and narrowed the credit. Flux/gradient controls checked in both themes. |
| geol-4.3 | Closed. Half-space initial/boundary conditions, diffusion equation, similarity variable, isotherm depth, units, and validity discussion checked against Parsons–Sclater §2/Appendix 1 and independent numerical checks. Fixed the collapse plot to show positive normalized temperature, matching its axis label. |
| geol-3.1 | Corrected the misattributed 130-km rms value to 90 km for the exact displayed Table 1 fit 2 pole/angle. The 130-km value concerns joining the northern and southern Atlantic blocks. Geological marker coordinates and Wegener details remain open. |
| geol-3.5 | Clarified that the vector formula needs radians; 111.2 mm/yr is the **maximum speed** for a 1°/Myr rotation at the stated Earth radius. Historical attribution remains open. |
| geol-3.2 | Corrected universal normal=positive/reversed=negative anomaly claim: inclination and orientation matter (Vine–Matthews p. 947). Clarified c.g.s. susceptibility and finite-edge effects when reversals are disabled. Checked all normal intervals through 5.9 Ma against WHOI’s complete CK95 table; restored the omitted Reunion interval (2.14–2.15 Ma), used 2.581 Ma and 5.894–6.137 Ma exactly, and corrected the Gilbert boundary. Other provenance remains open. |
| geol-3.11 | Corrected the claim that the angle between one paleopole pair determines a unique relative Euler rotation. Multiple coeval poles/geological constraints are needed. Original credit and model assumptions still need source review. |
| geol-3.14 | Corrected lower magnetic boundaries to the paper's defaults (11 km at ridge, 20 km deep ocean); central susceptibility is 0.0053, with ordinary blocks 0.0027. Caption distinguishes illustrative geometry and assumed declinations from the paper. The thickness control varies around the source's lower-boundary choice; it no longer defaults to an unrelated 2-km layer. Fig. 4 is described as a qualitative shape model. Finite edges/central contrast can still make anomalies without reversals. |
| geol-3.15 | Corrected the false one-year interval between Wilson 1965 and McKenzie–Parker December 1967. Removed the unverified MORVEL label from the synthetic-pole readout; it is explicitly illustrative. Original paper and pole provenance still open. |
| geol-4.4 | Preserved probe age when switching between age and square-root-age axes. Density quadrature now includes the tail below the 150-km drawing window, so comparison against the infinite-half-space formula is honest at old ages. |
| geol-4.5 | Corrected the transformed ridge integral's endpoint. After t=u² the integrand has a finite **nonzero** limit at u=0; replacing it with zero biased both total and conducted heat estimates. The new helper evaluates the cancelled expression directly. Published coefficients/provenance remain open. |

## Remaining source flags and what would close them

| Item | Missing evidence |
| --- | --- |
| geol-3.1 | Bullard–Everett–Smith fit definition and Table 1 are now fully checked. Sources for the displayed fossil/fold/basalt locality pairs and precise Wegener lecture details remain missing. The localities are approximate, not observations. |
| geol-3.2 | The entire modeled interval list is now checked against WHOI’s Cande–Kent CK95.M table. The independent Morley credit and historical publication details still need primary evidence. The consulted 1963 paper supplies neither chronology nor spreading-rate calibration. |
| geol-3.5 | Rigid-sphere derivation, unit conversion, and Morgan pp. 1959–1966 are checked. Independent Le Pichon attribution and schematic ridge provenance are not source-checked. |
| geol-3.6 | Morgan’s original text, pp. 1959–1966 (complete third-party transcription), now supports the small-circle geometry; original Wilson/McKenzie–Parker sources still needed for the combined historical attribution; actual bathymetry if synthetic azimuths are ever presented as measurements. Current noise and hidden pole remain labelled synthetic. |
| geol-3.9 | Original seamount age/coordinate table, uncertainty conventions, Sharp–Clague bend chronology and Tarduno hotspot-motion evidence. Memory-derived numbers cannot be certified. |
| geol-3.10 | Primary evidence for seismicity/depth interpretation, historical credit and the quoted discontinuity depths. Synthetic event depths are not a Wadati–Benioff catalogue. |
| geol-3.11 | Original Creer–Irving–Runcorn/Runcorn papers and the field-averaging/primary-remanence assumptions. Synthetic APW rotations stay illustrative. |
| geol-3.12 | Complete Wilson 1966 paper and geological basis for the stage examples; DOI metadata alone is insufficient. |
| geol-3.13 | Complete original Wegener 1912 paper, its precise argument, and authoritative elevation/land-fraction figures. The hypsometric mixture is synthetic. |
| geol-3.14 | The central model and principal Fig. 4 facts are now checked from the full original. The item additionally asserts Morley's independent publication history and subsequent Vine–Wilson calibration; those primary sources remain unread. Exact observed profiles and block geometry are not reconstructed. |
| geol-3.15 | Complete McKenzie–Parker paper, historical interpretation and source for the numerical reference pole. Synthetic slip data do not establish agreement with measured earthquakes or MORVEL. |
| geol-4.2 | Full Birch/Roy/Lachenbruch 1968 sources for province relationships, definitions, credits and 7.5/10-km regional slopes. Current fitted points are synthetic. |
| geol-4.4 | Full Stein & Stein 1992 for all GDH1 depth coefficients and domains. Parsons–Sclater coefficients and their overlapping domains are checked; switching their two approximations at 20 Ma is allowed by their stated >20-Ma domain. |
| geol-4.5 | Full Stein & Stein 1992/1994 and Parsons 1982 for heat-flow coefficients, hydrothermal interpretation and age–area law. The corrected quadrature does not make the illustrative hydrothermal curve data. |
| geol-4.6 | Full GDH1 source for the comparison curve. Plate-series mathematics, limits and P&S curve are checked, but that alone does not certify every curve in this item. |
| geol-4.7 | Primary onset results for all boundary conditions and stronger numerical convergence checks of the convection solver. Its time step freezes velocity through the two thermal stages, so it should not be assumed to be second-order for the coupled nonlinear problem. |
| geol-4.8 | Primary boundary-layer scaling sources, and reproducible convergence evidence for each offline Nu and velocity table entry. These are model outputs, not laboratory data. |
| geol-4.9 | Complete plume papers underlying attribution/claims and solver-resolution assessment. A constant-viscosity 2-D plume is illustrative. |
| geol-4.10 | Resolve Hirschmann coefficient discrepancy against original table/supplement; read complete McKenzie–Bickle model and source the stated crust thickness/ranges. The 500-K latent term and 700-K liquidus interval are illustrative, not fitted petrological values. |

All 19 remaining flags have a row above. Four previously unflagged conceptual items (3.3, 3.4, 3.7, 3.8) are outside these closures.

## Reproducible checks

- `node tests/verification-geol.test.mjs`: eight independent groups: PDE residual/boundaries, tabulated inverse-erf isotherm, finite-difference flux, integrated density, analytic triangular age–area heat integral, plate limits, analytic symmetric-prism field/sign reversal, finite-difference Euler velocity, and exact CK95 polarity-boundary checks (some groups combine related checks).
- `node tests/verification-geol-browser.mjs`: real pinned KaTeX via `installBrowserAssets`; light/dark native sliders, selects, toggles, buttons, and pointer drags for all ten changed visualizations (20 item/theme groups). Results and screenshots are written to `/tmp/geol-verification-browser.json` and `/tmp/geol-verification-shots/`.

## Bounded final acquisition

A new public-source pass on geol-3.12 did not yield its full original. Its source flag and precise missing-evidence record remain. New routes and their limits are recorded in [geology-bounded-source-followup.md](geology-bounded-source-followup.md).
