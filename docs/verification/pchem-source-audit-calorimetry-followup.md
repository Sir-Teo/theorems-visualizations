# Physical chemistry source audit: calorimetric entropy and Gibbs–Helmholtz

Reviewed 2026-10-18. Scope: **pchem-3.9 and pchem-3.13** in `content/pchem/ch03-b.js`. Follows the four completed potential/work reviews in [pchem-source-audit-potentials-followup.md](pchem-source-audit-potentials-followup.md). Other source flags, human/listening gates and Wave5 remain unchanged.

## Primary evidence

Full author [Arovas, Thermodynamics and Statistical Mechanics](https://courses.physics.ucsd.edu/2013/Spring/physics210a/LECTURES/BOOK_STATMECH.pdf), actual March19,2023 version, SHA-256 `f8335f922bdb497fb2df4977dc3629bae4fabf7def3e50caac370d19b0e1db2b`:

- §2.7.7, printed p.60 / PDF86, Eq.(2.139): calorimetric entropy integration and the ground-degeneracy integration constant.
- §5.6.3, printed pp.243–244 / PDF269–270, complete derivation of the acoustic density of states and Debye heat capacity, Eqs.(5.118)–(5.123). No empirical Debye-temperature table or original historical-priority claim is being cited.
- §2.8.4, printed p.63 / PDF89, Eqs.(2.153),(2.156): G=H−TS and G_T=−S. The displayed Gibbs–Helmholtz proof is their explicit product-rule consequence, with fixed composition and standard-state reaction differences taken consistently.

[Air Liquide's Argon physical-properties page](https://encyclopedia.airliquide.com/argon) was inspected directly: mass39.948g/mol, nominal1.013bar fusion temperature−189.37°C, boiling temperature−185.85°C, fusion latent heat29.588kJ/kg and vaporization latent heat161.14kJ/kg. These convert to83.78K/87.30K and the model's molar latent heats. The terminal HTML download did not contain the browsed property data, so no misleading content hash is claimed. The independent standard entropy154.846±0.003J/(mol K) at298.15K/1bar is the [NIST WebBook Ar CODATA review row](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7440371&Mask=1&Units=SI), already checked in the thermodynamics review. It is kept distinct from the older JANAF Ar value154.845.

### Actual archived JANAF reaction data

All seven complete official tab-delimited tables were downloaded, their relevant298.15–1000K rows inspected, and an exact subset generated into `content/pchem/pchem-source-audit-calorimetry.data.js`. The raw tables are retained in `docs/verification/sources/pchem-janaf/`; the hashes identify actual downloaded source bytes, not a reconstruction.

| Species | Official primary table | Local TSV SHA-256 |
|---|---|---|
| N₂ | [N-023](https://janaf.nist.gov/tables/N-023.html) | `e15d0f159ff4790511769075427bcdd3a3c04328209d40ddadd8726656f19621` |
| H₂ | [H-050](https://janaf.nist.gov/tables/H-050.html) | `091490382968f81736db19f9cf60cc233e47a5130403e100d9d6a5108f65c9f0` |
| NH₃ | [H-083](https://janaf.nist.gov/tables/H-083.html) | `1a992a1da0bd23c021f46fb223157d2fe3c9c5ceb53a1f89e77107a470a4c61a` |
| CO | [C-093](https://janaf.nist.gov/tables/C-093.html) | `dcfea0f98f9ae41a91e7f4c1a713bec463a6f0cf52333216605a908ba73d9242` |
| CO₂ | [C-095](https://janaf.nist.gov/tables/C-095.html) | `b9ecbb3758246a5d992e8313f281b81a7b33ddce20ae611dd5e8419e7b970aea` |
| H₂O(g) | [H-064](https://janaf.nist.gov/tables/H-064.html) | `8d68b9985b337c4d2918741a0d597799bf7b0205c00433a1f251c126ec0d65cb` |
| O₂ | [O-029](https://janaf.nist.gov/tables/O-029.html) | `47bd5d4d600e962b0ca18c30016364762ce9d4ff1a07f39ff300648635f7e648` |

These are official archival JANAF reference values, not a claim that every value is the latest experimental recommendation. In particular NH₃'s actual298.15K formation enthalpy is−45.898kJ/mol, while its300K row is−45.939. The previous mixed chapter2/CODATA inputs are not silently relabeled as this data set.

## Corrections and model limits

**3.9:** specifies the displayed three-phase integral for a final gaseous state, truncation for lower target temperatures, a unique ground state for S(0)=0, and the conditional acoustic-phonon applicability of the T³ extrapolation. Residual entropy is an independent integration constant. Solid entropy is evaluated from the Debye partition integral, and an illustrative extra heat-capacity profile e(T/Tm)^7 integrates to e(T/Tm)^7/7; the old linear profile incorrectly dominated the advertised low-temperature T³ term. Simpson quadrature uses960 panels; the dimensionless integral tail beyond60 is negligible at these scales. The adjustable default theta92K and liquid Cp44.6J/(mol K) are explicitly chosen model values; no unverifiable “typical”, calorimetric-fit or experimental1% accuracy claim remains. The pressure correction uses the sourced nominal1.013bar path. The endpoint control now reaches298.15K exactly, rather than stopping at298K after End. The solid curve reaches its actual transition endpoint. The readout reports an absolute mismatch magnitude with its correct short/over sign and does not assign a unique physical cause. The curve is compared with the tabulated entropy, not asserted to end on it.

**3.13:** replaces unverified mixed polynomial/formation/entropy inputs with one primary data set. Cp is linearly interpolated between actual JANAF rows; both H and S are analytically integrated from the same Cp, so dH/dT=Cp=T dS/dT and the Gibbs–Helmholtz identity remain consistent. This is explicitly an interpolation model, not exact measured thermochemistry. Formation enthalpies use the298.15K row plus each species' sensible enthalpy increment; the code does not confuse a temperature-dependent formation enthalpy with that sensible increment. At source-temperature nodes, maximum absolute differences between the model and independent JANAF reaction enthalpy/Gibbs columns are, respectively: Haber14.647/15.220J/mol; water–gas shift32.303/41.439J/mol; CO oxidation50.482/62.179J/mol. These are numerical reference comparisons, not experimental uncertainty bounds.

The full plot, tangent, draggable reference state and target control now all stay in300–1000K; the old plot extended down to294K and its right-panel reference line could fall below300K. The entire tangent and extrapolation markers are included when fitting axes. A numerical derivative independently verifies the1000 factor: slope with respect to1000/T is reaction H in kJ/mol. Open marker shape is correctly identified as a circle. The exact-comparison language is replaced by “temperature-dependent model”. Ideal-gas standard states may be hypothetical where a pure substance would condense; the diagram is not an equilibrium-yield calculation.

## Validation

`node --test tests/verification-pchem-source-audit-calorimetry.test.mjs`: **8/8 groups passed**. Tests independently reparse the seven raw source TSVs and compare every retained row/column; differentiate all seven species on every interpolation interval; integrate Cp by independent midpoint quadrature; verify all three Gibbs–Helmholtz slopes and tangent errors; compare with independently tabulated reaction H/G; check Debye entropy/C derivatives and low/high-T limits; verify manufacturer latent-heat conversions and both entropy jumps; and confirm the extra solid profile's heat-capacity/entropy consistency and preserved low-T leading order.

`node tests/verification-pchem-source-audit-calorimetry.mjs`: **4/4 real light/dark groups passed**. All8 argon parameter corners use native controls and check the actual298.15K endpoint plus plotted Cp/entropy values. All3 reactions×4 tangent/target corners use real pointer drags and controls, comparing displayed slopes/markers/error values, source domains and complete plot extents. Browser/TeX/nonfinite errors are checked. All four screenshots were inspected directly; a clipped reference-handle label and the argon mismatch sign were corrected before the final run. Screenshots: `/tmp/atlas-pchem-calorimetry-{argon,gibbs-helmholtz}-{light,dark}.png`; representative `/tmp/atlas-pchem-calorimetry-argon-dark.png`.

No shared chapter2/3 data helper, dependency array, central queue/master plan, package/global test or human/listening gate was changed. Only supported source flags are cleared after the final scoped passes.
