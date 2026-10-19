# Fuels and nuclear-energy review — 2026-10-18

Read AUTHORING.md and the physics/engineering field guidance. Four originally
flagged items are closed after reading the complete relevant technical passages;
four remain flagged. Chapters 3.2 and 3.5 were not originally flagged. The sparse
binding-energy lookup used by 3.5 was nevertheless corrected.

| Item | Disposition and source evidence |
| --- | --- |
| energy-3.1 | Closed. NIST Chemistry WebBook formation-enthalpy tables for [methane](https://webbook.nist.gov/cgi/cbook.cgi?Formula=CH4&NoIon=on&Units=SI&cTG=on), [propane](https://webbook.nist.gov/cgi/cbook.cgi?Name=propane&cTC=on&cTG=on&cTP=on), [octane](https://webbook.nist.gov/cgi/cbook.cgi?ID=C111659&Mask=2), [water gas/liquid](https://webbook.nist.gov/cgi/cbook.cgi?Name=water&cTC=on&cTG=on) and [CO2](https://webbook.nist.gov/cgi/cbook.cgi?ID=124-38-9&cTG=on). Relevant full thermochemistry tables and listed original references read. Rounded inputs give methane 55.51/50.03 and hydrogen 141.79/119.97 MJ/kg; no longer claims exact agreement with a different tabulation. Coal/wood composition and HHV are explicitly chosen model parameters. Added noncombustible residue to their mass accounting. |
| energy-3.3 | Closed. [RTI/NETL presentation (2022)](https://netl.doe.gov/sites/default/files/netl-file/22CM_PSC16_Lail.pdf), complete baseline/comparison tables on PDF pp.4 and6: DOE Case12 30wt%MEA uses3.6GJ/tCO2, with another referenced test3.75. Removed unsupported universal3.0–4.2 range. Binary-mixture separation work is independently derived from ideal mixing Gibbs energy, compression from RT ln(p2/p1); controls40% plant efficiency, steam work value.22 and compressor.75 are illustrative. The work-efficiency comparison now includes compression in both numerator and denominator. |
| energy-3.7 | Closed. [DOE-HDBK-1019/1-93](https://archives.standards.doxcelerate.com/documents/doe-hdbk-1019-1-93-doe-fundamentals-handbook-nuclear-physics-and-reactor-theory-volume-1-of-2), NP-02 pp.29–32, Table3, full passage. Replaced uncrosschecked precise Keepin fractions with this table's explicitly rounded group fractions and half-lives; beta sum.00649. Corrected prompt emission10^-13s. [Argonne SAS4A/SASSYS-1 §4.2](https://sas-doc.nse.anl.gov/latest/Part02/Ch04/power.html), Eq4.2-4, and [§4.3](https://sas-doc.nse.anl.gov/latest/Part02/Ch04/delayed-neutrons.html), Eqs4.3-1–3, supply full governing equations. Inhour relation independently derived by exponential substitution. Prevented matrix exponentials outside displayed power range; removed false claim that the prompt-only and delayed models join at one dollar. |
| energy-3.8 | Closed. Same full Argonne equations and DOE table as3.7. Exact ODE power is continuous; prompt jump identified as a separated-transient approximation. High-growth integration steps now resolve the prompt eigenvalue. Zero-feedback extrapolation stops at10^12 initial power, and the readout reports its actual end time rather than claiming60s. The energy-feedback coefficient remains explicitly illustrative, not a thermal-feedback reactor calculation. |
| energy-3.4 | Open. Exact energy-density table still needs sources for each row and convention (cell/pack, LHV/HHV, pressure and vessel inclusion). Removed the overly broad claim that hydrogen has the highest specific energy of any chemical fuel. |
| energy-3.6 | Open. [NIST thermal absorption table](https://www.ncnr.nist.gov/resources/n-lengths/list.html) fully checked for isotope absorption values, but this does not establish U235 fission585b, nu2.43 or the moderator slowing-down powers40/5.3/.75b. Resonance integral25b and fast-fission factor1.03 are already explicitly illustrative. The exact nuclear dataset/provenance comparison remains unresolved. |
| energy-3.9 | Open. Exact Way–Wigner coefficient.066 and claimed10s–100day domain still rely on secondary transcription; original Way/Wigner1948 comparison not obtained. Corrected water inventory: it remains constant while warming from40°C to boiling, then declines with latent-heat expenditure. Historical shutdown percentages are still pending primary checking; do not treat them as validation of this rough fit. |
| energy-3.10 | Open. Exact Bosch–Hale cross-section coefficient transcription, bremsstrahlung coefficient/convention, Lawson full paper and experiment gain definitions still need complete-source comparison. Bibliographic DOI10.1088/0370-1301/70/1/303 alone does not close the source check. |

`node tests/verification-energy-ch03.test.mjs`: **5/5 groups pass**. Includes
actual heating-value callbacks, keyed sparse mass numbers, actual DOE model inputs,
critical equilibrium, prompt continuity and independent inhour eigenvector
residuals, plus actual high-reactivity/scram callbacks and finite traces.

`node tests/verification-energy-ch03-browser.mjs energy-3.1 energy-3.3 energy-3.7 energy-3.8 energy-3.9`:
**10/10 light/dark real-input groups pass**, zero browser/TeX errors, local real
KaTeX0.16.11 installed with installBrowserAssets. Includes wood moisture, capture
extremes, prompt-critical extremes, scram mode, and boiling inventory controls.
Report `/tmp/atlas-energy-ch03-browser-energy-3.1-energy-3.3-energy-3.7-energy-3.8-energy-3.9.json`;
shots `/tmp/atlas-energy-ch03-shots`. Static chapter check10items,0errors/warnings.

After correcting native logarithmic range mapping, the affected3.7/3.8/3.9
two-theme endpoint rerun passed **6/6**, including physical Lambda=10^-5s and
operating time1500days. Report
`/tmp/atlas-energy-ch03-browser-energy-3.7-energy-3.8-energy-3.9.json`.
