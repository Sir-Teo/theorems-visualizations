# Aerospace corner-flow source audit

Resolved: **aero-4.5**. Parent independent mathematical/native checks and original-source/final screenshot inspection passed; source flag and ledger are reconciled.

Read the complete relevant original sections in [NACA Report 1135, Equations, Tables, and Charts for Compressible Flow](https://ntrs.nasa.gov/api/citations/19930091059/downloads/19930091059.pdf), printed **pp620–626**: conservation equations 115–123, oblique jumps128–147, branch/attachment discussion and independent maximum-angle formula 168, and Prandtl–Meyer relations 171–174. Rendered and inspected the actual formulas on printed pp621,624,626. Also read NASA Glenn's complete official [Oblique Shock Waves](https://www.grc.nasa.gov/www/k-12/airplane/oblique.html) and [Prandtl–Meyer Angle](https://www.grc.nasa.gov/www/k-12/airplane/pranmyer.html) pages. The original report supplies the exact formulas used for verification. The unverified Meyer dissertation/date attribution is removed.

The revised model states both shock branches and their downstream-condition limitation, allows the weak downstream state to be subsonic near attachment loss, and distinguishes an attached root from a detached-shock geometry that is not solved. Zero turn requires no wave. Expansion uses the available turn from the actual upstream Mach, and its inverse brackets dynamically. The diagram contains a corner and wave/direction schematic. The expansion graph now includes its large computed downstream Mach instead of omitting points above 6; wave/corner bounds and padded relation axes replace the former clipping. A misleading finite-turn isentropic-compression comparison, which silently clamped an unavailable Prandtl–Meyer inverse to sonic flow, is removed.

Executed verification on October 19, 2026:

- `node --test tests/verification-aero-corner.test.mjs`: **3 groups pass**; independent shock mass/momentum/enthalpy and entropy checks; independent closed maximum-angle formula; numerical integration of the Mach differential for expansion and its inverse.
- `node tests/verification-aero-corner-heating-paper.mjs`: **12 groups pass across all three entries**, at viewport widths **1450 and 430**, in **light and dark** themes; actual slider/branch endpoints, an attached weak/subsonic state, zero turn, full large-Mach expansion and all finite schematic/relation geometry with measured canvas-label bounds/nonoverlap, complete finite geometry, display-TeX containment and no document overflow.

Source read October 19, 2026. PDF `/tmp/atlas-aero-naca1135.pdf`, SHA256 `1971643025181d1216b0b0a359d2a5a3adf5d254d3e158e19ba880b368b86e53`. Source renderings `/tmp/atlas-aero-naca1135-page{8,9,10,12,14}.png` use zero-based indices. No historical-priority claim, viscous calculation or real-gas validation is supplied.

Final browser screenshots use `/tmp/atlas-aero-corner-heating-paper-<case>-<1450|430>-<light|dark>.png`; narrow panels are also saved separately as `-panel<index>.png`. Inspected final desktop dark and narrow light/dark images, including extreme controls and the source anchors. The narrow pass found and fixed the long Prandtl–Meyer display equation overflow and a heating marker that touched the lower plot edge; the complete final 12-group rerun passes.

The final 12-group browser rerun also passes with exact rendered dot bounds: filled core rings add 0.75 px, hollow strokes add half their configured/default 1.8 px width, and source `dots()` points include their 2.5 px radius. The 430 px station-endpoint padding contains the selected marker including its ring.

Parent independently reran the complete seven mathematical and twelve native groups for this batch, including1450/430px in both themes, inspected the original equations/tables and representative final narrow layouts, and confirmed the Ackeret4.6entry is preserved. Full marker/stroke bounds are checked, including filled rings, hollow strokes and tabulated source-point radii.
