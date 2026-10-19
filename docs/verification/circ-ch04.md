# Circuits chapter 4 verification — 18 October 2026

All eighteen source flags were reviewed. Twelve are closed after reading the
relevant complete technical text; six remain explicit. Browser rendering or
agreement with a toy model does not establish fidelity to an original paper.

## Evidence read

- [Agarwal and Lang, *Foundations of Analog and Digital Electronic Circuits* (2005)](https://neurophysics.ucsd.edu/courses/physics_120/Agarwal%20and%20Lang%20%282005%29%20Foundations%20of%20Analog%20and%20Digital.pdf),
  the complete textbook linked by [MIT OCW's course readings](https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/readings/).
  Relevant complete passages: §§4.3–4.5, pp. 203–222 (load line, assumed states,
  Taylor expansion and incremental conductance); §5.1, pp. 245–252 (static
  discipline/noise margins); §§6.6–6.8, pp. 300–307 (switch resistance and gate
  insulation); §§7.3–7.6 (triode/saturation models and transfer curve);
  §8.2.2, pp. 418–425 (small-signal gain/bias); §11.5, pp. 611–615 (CMOS and
  charge/discharge energy). These are authoritative teaching models, not primary
  historical invention records.
- [Shockley (1949), BSTJ 28, 435–489](https://archive.org/download/bstj28-3-435/bstj28-3-435.pdf),
  with the [full scan's OCR](https://archive.org/download/bstj28-3-435/bstj28-3-435_djvu.txt).
  §§4.2–4.3, printed pp. 458–461, Eqs. (4.4), (4.8), (4.11), (4.13): minority
  carrier density, diffusion and total junction current. §6, pp. 472–474,
  Eqs. (6.1)–(6.4): emitter/collector currents and sech transport factor.
  Shockley's base width is 2w; the visualization calls the full width W. The
  plotted injection parameter D and gamma(W,D) are explicitly illustrative;
  they are not an equation or measured doping ratio from the paper.
- [Wanlass, US3356858A](https://patents.google.com/patent/US3356858A/en):
  complete technical description of the complementary devices, Fig. 5 inverter,
  following NAND/NOR examples and claims. The patent supports the June 18,
  1963 filing, complementary connection, off-device isolation and low standby
  power. It does **not** replace reading the separate Wanlass–Sah conference
  paper (item 4.17).
- [Kahng, US3102230A](https://patents.google.com/patent/US3102230A/en):
  full description of Figs. 1A–2, fabrication, operating arrangements and six
  claims. The specification explicitly cites M. M. Atalla's March 8, 1960
  application. [Lilienfeld, US1745175A](https://patents.google.com/patent/US1745175A/en):
  full specification and claims, including Canadian filing October 22, 1925,
  US filing October 8, 1926 and grant January 28, 1930. The credit now states
  those patent facts rather than an unverified prototype demonstration date.
- [Kilby, US3138743A](https://patents.google.com/patent/US3138743A/en):
  full relevant component/construction descriptions, Figs. 1–8c and integrated
  circuit claims. The patent describes both bonded wires and conductors on
  insulation, junction and dielectric capacitors, a multivibrator and a
  distributed-RC oscillator. The simulation's three-section loaded low-pass
  ladder is an independent illustration, not Kilby's layout or data.
- [Moore (1965), full IEEE reprint](https://www.cs.utexas.edu/~fussell/courses/cs352h/papers/moore.pdf),
  pp. 82–85, especially “Costs and curves,” p. 83; and
  [Moore (1975), full paper](https://www.eng.auburn.edu/~agrawvd/COURSE/E7770_Spr07/READ/Gordon_Moore_1975_Speech.pdf),
  original pp. 11–13, all discussion and Figs. 1–5. The 1965 text states a
  present cost minimum of **50** components and forecasts approximately 65,000
  in 1975. The two-year slope in 1975 is a forecast for the end of that decade.
  An annual line anchored at 64 is now labeled an approximate scenario, not a
  measured anchor. Unchecked modern chip counts and their fit were removed.

Temporary downloaded evidence is under `/tmp/circ-sources`; the URLs and
locators above are the durable source trail. Search snippets/abstracts were
not used to clear original-paper flags.

## Disposition

| Item | Result and correction |
| --- | --- |
| circ-4.1 | Closed. Shockley current law and textbook characteristic checked. Reverse saturation and straightness on semilog axes are asymptotic, not exact at every negative/positive voltage. Ideality factor n is an empirical extension of Shockley's n=1 diffusion law. |
| circ-4.2 | Closed. Load-line construction checked against §4.3. Corrected uniqueness hypothesis: R>0 and continuous nondecreasing g on the real line suffice; a diode's reverse current need not tend to minus infinity. |
| circ-4.3 | Closed. Full assumed-state construction and tangent approximation checked against §§4.4–4.5. Device values and fitted control ranges are illustrative. |
| circ-4.4 | Closed. Taylor expansion checked against Eqs. (4.54)–(4.75). Differentiability gives an o(delta-v) remainder; a second-order error additionally needs appropriate second-derivative regularity. Small-sinusoid second harmonic follows by expanding sin-squared. |
| circ-4.5 | Open historical comparison. Rectifier mathematics checked; corrected sampled ideal-diode output to max(rectified input, exponentially decayed capacitor voltage), preventing output below the forward-conduction envelope. Fleming's US803684A full specification was read, but Pollak/Graetz bridge originals were not obtained. |
| circ-4.6 | Closed. Source noise-margin definition checked. Inverter iteration has an attracting two-cycle; two attracting rail fixed points belong to the **two-stage** map. Noise guarantee requires an initially valid level and settled gates. |
| circ-4.7 | Closed. Switch-resistor model/ideal gate checked against textbook, and narrowed patent credit checked against complete Kahng/Lilienfeld specifications. Body-to-source connection is explicit. |
| circ-4.8 | Closed. Wanlass patent plus textbook §11.5 support complementary topology and static leakage distinction. Square-law device parameters and 1 nA leakage are illustrative. |
| circ-4.9 | Open historical comparison. NAND constructions are mathematically correct, including XOR; positive input arity is explicit. Sheffer's full 1913 paper could not be retrieved; Peirce's unpublished priority has not been checked. |
| circ-4.10 | Open original-model attribution. Fixed missing lambda factors in triode formula, region boundary and triode transconductance; plot shading follows the same boundary, and transfer-axis range now includes the full current. The helper applies the empirical factor to both branches to maintain continuity. Removed the unchecked “Proc. IEEE 52” locator. Complete Sah/Shichman–Hodges comparison remains missing. |
| circ-4.11 | Closed. Shockley emitter/collector current relations plus KCL give beta=alpha/(1-alpha); scope labels the finite-voltage knee and Early correction as illustrative extensions. Base current includes emitter back-injection as well as base recombination. Current-gain range is not presented as a measured universal value. Plot follows load-current range. |
| circ-4.12 | Closed. Textbook §8.2.2 gain and bias treatment checked; finite output conductance is a stated empirical extension. Numerical differentiation evaluates the displayed whole-circuit gain. A centered bias does not make a nonlinear finite swing exactly symmetric. |
| circ-4.13 | Open historical comparison. Restricted “exactly three equilibria” to the actual symmetric tanh model; a generic decreasing transfer curve need not have exactly three. Corrected critical g=1 nonlinear attraction, exact-grid root handling, individual-inverter/loop-gain terminology and swapped above/below-diagonal buttons. Eccles–Jordan original full text is still missing. |
| circ-4.14 | Open original letter. The illustrative collector law now has a voltage-compliance knee so all displayed operating points really intersect their load line, even under strong drive. Gains include output conductance and load power. Removed an unchecked contact-spacing claim and the misleading “letter dated July 15” wording. |
| circ-4.15 | Closed. Full relevant Shockley derivations checked, with base-width notation reconciled. Density plot includes the equilibrium background; labels now say so. Injection parameter is not called a measured doping ratio; controls irrelevant to the selected mode are hidden. |
| circ-4.16 | Closed. Complete relevant Kilby specification checked. Patent history is limited to supported filing/grant facts. The low-pass ladder has characteristic polynomial z^3+5z^2+6z+(1+A), giving threshold A=29 and onset omega-RC=sqrt(6); the familiar reciprocal-sqrt(6) formula is for a different RC topology. Finite-amplitude frequency can shift. |
| circ-4.17 | Open conference-paper comparison. Corrected the claimed “crossover”: parallel power curves with identical dynamic terms do not cross. Gold marks dynamic power equal to resistor-load static power. The resistor supply-current step response now remains continuous at switch-on. Average-power and local-transient scenarios have separate explicit assumptions. Patent evidence alone cannot verify a separate conference paper. |
| circ-4.18 | Closed. Both complete Moore papers checked. Corrected 50-versus-64 provenance and 1975 forecast timing; removed unsourced modern chip observations and their fit. Economic cost curves and continuation are explicit scenarios. |

## Remaining original access gaps

- **4.5:** Pollak/Graetz bridge originals. The attempted Google Patents
  DE96564C URL returned 404; Fleming's separate thermionic-rectifier patent
  does not prove the bridge priority claim.
- **4.9:** [Sheffer (1913), AMS full PDF](https://www.ams.org/journals/tran/1913-014-04/S0002-9947-1913-1500960-1/S0002-9947-1913-1500960-1.pdf)
  and the alternate `/tran/` path both returned HTTP 403.
- **4.10:** full original Sah and Shichman–Hodges papers still required to
  check historical/model attribution against the continuity-preserving toy model.
- **4.13:** [Eccles–Jordan original-paper endpoint](https://iopscience.iop.org/article/10.1088/1478-7814/32/1/316/pdf)
  returned a CAPTCHA page rather than a PDF. Google Patents GB148582A supplies
  a technical summary, not a complete original specification; this was not
  accepted as full-source closure.
- **4.14:** [Bardeen–Brattain original letter](https://journals.aps.org/pr/pdf/10.1103/PhysRev.74.230)
  returned HTTP 403. The downloaded Shockley paper cites it but does not replace
  reading that letter.
- **4.17:** [Wanlass–Sah conference original](https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=1157450)
  failed with HTTP 403. Full Wanlass patent supports 4.8; it is not the paper.

## Reproducible verification

`node tests/verification-circ.test.mjs` passes seven independent groups:
diode KCL including reverse bias; MOS boundary/finite-difference derivatives;
latch root residuals and critical stability; point-contact load-line residuals
under extreme drive; oscillator onset/zero crossings; static power gap and
continuous RC step current; ideal rectifier forward envelope. Tests execute the
real visualization callbacks, then compare against independent equations.

`node scripts/check.mjs circ/4 --static`: eighteen items, zero errors/warnings.

`node tests/verification-circ-browser.mjs` uses the actual `tools/harness.html`
and `installBrowserAssets` with real KaTeX 0.16.11. It exercises native slider
Home/End events, every segmented option, visible toggle labels, buttons and real
mouse drags in both themes. Results are saved to
`/tmp/circ-verification-browser.json`; screenshots are saved to
`/tmp/circ-verification-shots/`. The complete run passed **36 item/theme checks, 134 slider endpoint sweeps and
6 actual pointer drags**, with zero runtime/TeX errors and no blank canvases.
All 36 default screenshots were visually inspected in six contact sheets; the
1975 forecast label was moved inward after inspection and that item was checked
again in both themes. Source closures do not depend on screenshots alone.
