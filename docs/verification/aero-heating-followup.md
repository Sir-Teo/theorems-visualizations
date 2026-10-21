# Aerospace stagnation-heating source audit

Resolved: **aero-4.7**. Parent independent mathematical/native checks and original-source/final screenshot inspection passed; source flag and ledger are reconciled.

Read Sutton and Graves's original [NASA TR R-376 (1971)](https://ntrs.nasa.gov/api/citations/19720003329/downloads/19720003329.pdf), **printed pp1–21** in full: introduction/computer study, approximated transport derivation, equations 33–45 and results/conclusions. Its calculation considers equilibrium mixtures, a broad enthalpy/pressure range and two wall temperatures, and omits radiative heating. This is not a blanket fit-validity guarantee for a later fixed-coefficient formula.

Also read the complete **Lecture 1, slides 1–31**, of the official [NASA TFAWS2012 Aerothermodynamics Course](https://tfaws.nasa.gov/TFAWS12/Proceedings/Aerothermodynamics%20Course.pdf), including theory/engineering simplification, effective-radius cautions, hot-wall correction and the surface energy balance. Inspected actual **slide 17** for the Earth SI coefficient 1.7415×10⁻⁴ and fully catalytic assumption, **slide 28** for radiation balance, and **slide 29** for the worked density 3.1459×10⁻⁴ kg/m³, radius 1 m, speed 3535 m/s, emissivity 0.8 example. The source rounds the resulting flux to 13.6 W/cm² and then computes 1316 K; evaluating its unrounded flux can differ by about 1 K.

The revised visualization uses that verified fixed Earth coefficient, with explicit density/radius/speed units. It removes unsupported material-temperature approval and a universal Mach threshold. The radiation result is explicitly a separate cold-wall-input reference balance, without hot-wall feedback, conduction, ablation or incident radiation. Full adaptive bounds replace clipped curves and a clamped temperature marker. The NASA-example button supplies a reproducible primary-source numerical anchor.

Executed verification on October 19, 2026:

- `node --test tests/verification-aero-heating.test.mjs`: **2 groups pass**; independent rounded source example, quartic-root bisection, dimensional log expressions, full parameter corners and exact similarity ratios.
- `node tests/verification-aero-corner-heating-paper.mjs`: **12 groups pass across all three entries**, at viewport widths **1450 and 430**, in **light and dark** themes; all 16 actual density/radius/emissivity/speed endpoints, source-example button, direct flux/emission balance and all complete curves/markers, with measured label bounds/nonoverlap, display-TeX containment and no document overflow.

Read October 19, 2026. PDFs `/tmp/atlas-aero-sutton1971.pdf`, SHA256 `bdc8c4241db8a665623a0c5466a55d7bbf738208f5c634543a8ef851a7718479`; `/tmp/atlas-aero-tfaws2012.pdf`, SHA256 `4f6946b9151dea2565b0e19751493f0cc2675a6d785c7873f70e4fe51f135279`. Source renderings `/tmp/atlas-aero-{sutton1971,tfaws2012}-page*.png`. The historical Fay–Riddell original is not claimed read; its earlier citation and detailed unverified material assertions are removed.

Final browser screenshots use `/tmp/atlas-aero-corner-heating-paper-<case>-<1450|430>-<light|dark>.png`; narrow panels are also saved separately as `-panel<index>.png`. Inspected final desktop dark and narrow light/dark images, including extreme controls and the source anchors. The narrow pass found and fixed the long Prandtl–Meyer display equation overflow and a heating marker that touched the lower plot edge; the complete final 12-group rerun passes.

The final 12-group browser rerun also passes with exact rendered dot bounds: filled core rings add 0.75 px, hollow strokes add half their configured/default 1.8 px width, and source `dots()` points include their 2.5 px radius. The 430 px station-endpoint padding contains the selected marker including its ring.

Parent independently reran the complete seven mathematical and twelve native groups for this batch, including1450/430px in both themes, inspected the original equations/tables and representative final narrow layouts, and confirmed the Ackeret4.6entry is preserved. Full marker/stroke bounds are checked, including filled rings, hollow strokes and tabulated source-point radii.
