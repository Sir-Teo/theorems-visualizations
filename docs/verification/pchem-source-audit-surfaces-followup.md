# Physical chemistry surface-force / capillarity review

Completed **pchem-4.9, pchem-4.11, pchem-4.13**. Source/math/native/screenshot review complete before flag clears. Other two items in `ch04-b.js` remain flagged for their separate review. Dedicated helper `pchem-source-audit-surfaces.shared.js`; no central/package/existing shared helper edits.

## Primary evidence

[John Bush, MIT18.357 complete author course notes](https://ocw.mit.edu/courses/18-357-interfacial-phenomena-fall-2010/04759cfc15c79928ca9f72a18b3864dd_MIT18_357F10_lec_all.pdf), full82page PDF, SHA256 `36e518f13c4a4042672dbef5a1a951df7f8181fcf02a805cbffe59005784d34a`. Actually read §§2.3–2.6printed6–10/PDF7–11 (energy/force definition, spherical energy variation, two-face factor), §§5.1–5.3printed14–18/PDF15–19 (full normal-stress balance and curvature sign), and chapter8printed26–28/PDF27–29 (full energy, force and pressure derivations of Eq8.1, including small-radius/height assumptions). Classical name/date priority claims removed; theorem/method sources are the complete modern author derivations.

[Howard DeVoe, Thermodynamics and Chemistry, second edition v10Jan2020](https://www2.chem.umd.edu/thermobook/v10-screen.pdf), full534page PDF, SHA256 `1b2e4849bd538bf282dab8470661a50d97ae8200ff51b87d120bf39dbaff0ecd`. Read §5.7printed/PDF147–148, Figure5.1 and Eqs5.7.1–5.7.4: full sliding-film work/Gibbs derivative proof. §8.1.5printed/PDF200–201, Eqs8.1.15–8.1.16, droplet and bubble pressure statements (complete pressure derivation additionally supplied by Bush, rather than treating DeVoe's assigned exercise as a proof).

[IAPWS R1-76(2014), full original6page release](https://iapws.org/documents/release/Surf-H2O.download), SHA256 `77d07ae4c6d473806b73f982d4c031b927db02a5718bd3c25cd7a03c3321587d`. Formula and scope onp3; Table1pp4–5calculated and experimental columns distinguished. Independent calculated rows .01,20,50,100,200,300°C reproduce rounding. The formula is valid triple-to-critical, with explicitly permitted supercooled extension. Water comparison uses actual correlation; other liquid constants/preset angles remain disclosed illustration parameters, not newly measured data.

## Corrections

4.9 fixes the **selected** rubber force/readout and triangular work integral (previously always reported the film law and area work). Native12cmbar and14.5cmposition now fit both panels; no clipped frame/marker. Clarifies fixed surface tension/composition and the missing film-stability physics. The Hooke comparison is chosen, not a measured elastomer constitutive relation.

4.11 fixes radius/tension/interface controls by restarting state and clock. Selected physical pressure now drives the rate with chosen constant mobility, so changing gamma/faces actually changes motion. Corrects one-interface area derivative versus two-interface multiplication in the proof. Views fit both full spheres as volume transfers. The0.6cmcutoff is explicit; removed the false claim of calculating a tube-mouth cap, and a stopped state no longer reports continuing flow. Total gas volume conservation is explicitly a low-pressure approximation, not exact compressible mass conservation; one-interface mode is a connected-liquid-sphere analogue.

4.13 removes the artificial radius enlargement and false “to scale” claim for wall thickness, fits negative depression and positive rise, and shows the proper inside/outside tube fluid regions. A signed-height plot replaces a log plot that had silently floored zero/near-zero at0.1mm.90° is exactly zero. Dashed wide-tube continuation is explicitly outside the physical small-radius prediction. The optional zero-angle r/3 estimate is identified as spherical-meniscus geometry, independently integrated; unsupported Rayleigh historical attribution removed. Its correction is not advertised as restoring wide-tube validity. Chosen0.3capillary-length threshold is not an error bound.

## Checks

- `node --test tests/verification-pchem-source-audit-surfaces.test.mjs`: **6/6groups**, official IAPWS table, independent force quadrature/work derivative, area/volume Laplace derivative, long conservative sphere evolution/actual pressure scaling/cutoff/equal-radius balance, Jurin force/hydrostatic balance and neutral angle, independently integrated hemispherical volume correction.
- `node tests/verification-pchem-source-audit-surfaces.mjs`: **6/6item/theme groups** in real light/dark browser controls. Frame4liquids×2lengths×2models×2drags plus water temperature endpoints; sphere2interfaces×8parameter corners and play to cutoff, state/clock resets and conserved volume; capillary3liquids×3angles×2radius corners plus3correctioncases. Checks actual output markers, pressure bars, circles, coordinate containment, no browser/TeX errors.
- Inspected `/tmp/atlas-pchem-surfaces-frame-light.png`, `...-laplace-dark.png`, `...-capillary-light.png`; both-theme captures exist for all3. Extreme extension,0.6cmstopped sphere and186mmcapillary depression shown honestly.

No subjective listening/human gate or Wave5 closure.
