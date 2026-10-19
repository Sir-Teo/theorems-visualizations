# Aerodynamics source and numerical review — 2026-10-18

Read AUTHORING.md and physics/engineering field guidance. Relevant complete
technical passages were read from the sources below. Seven previously flagged
items are closed; aero-4.1 remains open. The unflagged aero-4.4 also needed a
substantive numerical correction.

| Item | Source evidence and disposition |
| --- | --- |
| aero-3.7 | Closed. [Wieselsberger, NACA TM77](https://ntrs.nasa.gov/api/citations/19930081293/downloads/19930081293.pdf), full relevant monoplane derivation pp.1–5, Eqs.(1)–(5); Eq.(4) also inspected in a rendered scan. Original1921 article, April1922 translation. The printed approximation is sigma=(1−0.66H/b)/(1.05+3.7H/b), with image spacing H=2h. Thus existing coefficients1.32/7.4 are correct in terms of ground height h, but the source's domain1/15≤H/b≤1/2 means only1/30≤h/b≤1/4. Restricted the dashed curve and readout to that domain; it assumes fixed elliptical loading, whereas the blue rectangular-wing load is recomputed. Removed unsupported near-universal numerical claims. |
| aero-4.1 | Open. [Ackeret TM317](https://ntrs.nasa.gov/api/citations/19930087085/downloads/19930087085.pdf), p.1, independently confirms Prandtl's unpublished Göttingen lecture by1925; [Jones TN1033](https://ntrs.nasa.gov/api/citations/19930081951/downloads/19930081951.pdf), pp.4–6, confirms the linear subsonic scaling. The full Glauert1928 DOI[10.1098/rspa.1928.0039](https://doi.org/10.1098/rspa.1928.0039) was not obtained (publisher403); exact Kármán–Tsien and Laitone comparison-law source passages remain unchecked. Retained verify:true. |
| aero-4.2 | Closed. [Mason, Configuration Aerodynamics](https://archive.aoe.vt.edu/mason/Mason_f/ConfigAeroTransonics.pdf), complete §§7.2,7.4.3,7.5.2: Eq.(7-2) critical pressure, Eqs.(7-3)–(7-4) Korn relation,0.87/0.95 technology factors, Eqs.(7-5)–(7-9) Lock fourth-power rise and derivative0.1 definition. These are engineering correlations, not universal shock laws. Corrected caption: changing the technology factor changes the correlation, not the symmetric panel-method section. |
| aero-4.3 | Closed. [Jones, NACA TN1033](https://ntrs.nasa.gov/api/citations/19930081951/downloads/19930081951.pdf), complete normal-flow derivation pp.1–7, Eqs.(1)–(6), and reference9 for Busemann1935. Removed unverified exact1944 priority wording. Mason §7.5.2 supplies the swept-wing engineering correlation; the ideal normal-flow principle does not certify it for a finite wing. |
| aero-4.4 | Corrected. [Sheppard, ARC R&M3077](https://reports.aerade.cranfield.ac.uk/bitstream/handle/1826.2/3647/arc-rm-3077.pdf?isAllowed=y&sequence=1), complete §§2.1–2.3.1 and4.2, printed pp.2–5 and17; the p.5 Fourier formula was also inspected as an image. Fourier coefficients belong to S′(x(theta)), not S(theta). Updated both code and displayed derivation. Restricted the wing-position control so the remaining fuselage has nonnegative area at every allowed setting. Indentation changes volume; each plotted ratio uses the minimum at that setting's volume. |
| aero-4.5 | Closed. [NASA Glenn oblique shocks](https://www.grc.nasa.gov/www/k-12/airplane/oblique.html) and [Prandtl–Meyer angle](https://www.grc.nasa.gov/www/k-12/airplane/pranmyer.html), complete technical descriptions and equations. Primary Ackeret TM317 p.2 credits Prandtl/Meyer and cites Meyer's1908 reportNo.62; unsupported dissertation/supervisor details removed. Weak shocks can give subsonic downstream flow near attachment limit. An isentropic-compression comparison is now withheld when the proposed turn exceeds the available Prandtl–Meyer angle. |
| aero-4.6 | Closed. Full [Ackeret, NACA TM317](https://ntrs.nasa.gov/api/citations/19930087085/downloads/19930087085.pdf), pp.1–8. Original venue/date/pages confirmed by p.1 footnote: Zeitschrift für Flugtechnik und Motorluftschiffahrt, February14,1925, pp.72–74. Linearization and force integrals pp.5–7, with p.6 rendered to read the scanned formulas. [Chapman, NACA TR1063](https://ntrs.nasa.gov/api/citations/19930092109/downloads/19930092109.pdf), printed p.6, pressure formula preceding Eq.(17), rendered and read in context, independently gives P=2y′/sqrt(M∞²−1). Fixed zero-angle flat-plate0/0 percentage, and reject a rear expansion entered from subsonic flow. Comparison is explicitly an inviscid shock–expansion approximation. |
| aero-4.7 | Closed. [Sutton–Graves TRR376](https://ntrs.nasa.gov/api/citations/19720003329/downloads/19720003329.pdf), complete relevant derivation pp.12–17, Eq.(33) and study conditions pp.1–2. [NASA TFAWS2012 course](https://tfaws.nasa.gov/TFAWS12/Proceedings/Aerothermodynamics%20Course.pdf), complete Lecture1 pp.15–18 and28–29: SI coefficient1.7415e−4, fully catalytic surface, hot-wall correction and radiative balance. Removed unsupported blanket accuracy claim, corrected an inverted boundary-layer-thickness explanation, and explicitly qualify the cold-wall-flux temperature estimate. Removed unsourced titanium threshold and material-suitability verdict. Shuttle references450/1530/1920K are rounded350/2300/3000°F: [Kennedy facts p.1](https://www3.nasa.gov/centers/kennedy/pdf/167473main_TPS-08.pdf), [NASA Shuttle history, full TPS discussion](https://www.nasa.gov/history/sts1/pages/tps.html), [Rummler p.295, full Shuttle section](https://ntrs.nasa.gov/api/citations/19830003892/downloads/19830003892.pdf). They describe different structural/insulation roles. Selected wall-temperature marker now retains its actual ordinate and expands the axis when needed. |
| aero-4.8 | Closed. Full [Whitcomb RML52H08](https://ntrs.nasa.gov/api/citations/19930087283/downloads/19930087283.pdf), pp.1–12: test configurations/method, Mach0.85–1.10, uncertainty, approximate equal-area comparisons and indentation tests. Summary rewritten from these passages, including the limitations and swept-wing drag-rise0.012/0.004 example on p.9. Removed unchecked Report1273 linkage and Collier/date anecdotes. Model curves remain explicitly separate from tunnel data; their area-drag calculation shares the corrected4.4 implementation. |

## Wave-drag correction

The old formula expanded area S itself and multiplied its squared coefficients
by6pi/l². It matched the Sears–Haack shape by calibration but could assign another
shape drag below the claimed theoretical minimum. The source instead expands
S′(x(theta))=sum a_n sin(n theta), x=l(1−cos theta)/2, with
D/q=(pi/4)sum n a_n². Coefficients now use integration by parts against
sin(n theta)/sin(theta), avoiding a noisy finite difference of area.

Independent analytic fixtures include S=A sin³(theta)(1+k cos(theta)), whose only
nonzero slope coefficients are a2=3A/l and a3=2Ak/l, and S=A sin⁵(theta), with
a2=2.5A/l and a4=−1.25A/l. The former has the same volume for every k but drag
ratio1+2k²/3. The latter has drag1.5times its same-volume Sears–Haack minimum.
Production30-mode wing-hump drag agrees within0.5% with independent analytic-slope
integration using100modes and4000angular samples across the tested control domain.

## Validation

`node tests/verification-aero.test.mjs`: **9/9 groups pass**, covering integrated
Prandtl–Meyer turning, both shock branches' conservation laws, Ackeret's small-angle
limit and symmetry, independent Fourier fixtures and dimensional scaling,
area-drag assembly/minimum/nonnegative fuselage, Korn/Lock derivative, actual
zero-state/invalid-corner callbacks, NASA heat-flux worked example, and the actual
ground-effect readout and fixed-fit domain.

`node tests/verification-aero-browser.mjs aero-4.2 aero-4.4 aero-4.5 aero-4.6 aero-4.7 aero-4.8`:
12/12 light/dark input groups passed with real local KaTeX0.16.11, zero browser or
TeX errors. An additional aero-3.7/aero-4.3 two-theme run passed4/4. Screenshots
of area ruling and heating were inspected. This caught test-input mistakes:
logarithmic native ranges require log10 values, and a handle's rendered ordinate
must be read rather than assumed. Dedicated helpers now convert physical log
inputs and locate actual handles; affected groups are rerun before final closure.
The numerical extreme-control checks above were already independent of browser
input-coordinate conversion. Remaining source gap: aero-4.1 as recorded above.

Corrected physical log-input and actual-handle endpoint rerun:
`node tests/verification-aero-browser.mjs aero-3.7 aero-4.7` passed **4/4**
with zero browser/TeX errors. Reports are `/tmp/atlas-aero-browser-*.json`;
screenshots `/tmp/atlas-aero-shots`. The scoped static check covered38items in
aero/3,aero/4,energy/3,energy/4 with0errors/warnings.

Cross-field prerequisite audit: aero-4.7 calculates q=epsilon*sigma*Twall^4, the Stefan–Boltzmann law explicitly shown in the reviewed NASA TFAWS2012 lecture. Added thermo-9.6 to item and syllabus. Also synchronized its existing aero-1.6 prerequisite in the syllabus. Removed an unhelpful gas-temperature/material-limit comparison.

## Bounded source-acquisition follow-up

The complete Glauert1928 original pp.113–119 has now been recovered from a public library scan and read, including manual inspection of §3 pp.117–119, Eq.(16), the small-disturbance coordinate change and the original comparison table/limitations. Complete NACA TN3970 pp.16–18, Eqs.(32)–(36), also verifies the Kármán–Tsien formula, with Eq.(36) manually inspected and algebraically compared against the existing implementation. The flag remains **open solely for the exact displayed Laitone comparison formula**; the general local-Mach discussion in TN3970 AppendixA is not accepted as a substitute for that formula. URLs, hashes and acquisition outcomes are in [the bounded acquisition report](physics-source-acquisition-pass.md).
