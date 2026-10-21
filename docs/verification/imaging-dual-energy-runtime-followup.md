# IMAGING 2.9 — explicit singular inversion and exact local controls

20 October 2026. Producer runtime candidate, independent acceptance pending.
Built after prerequisite boundary `37ea502c3aede818110e2097c238bfc38e753c6a` (local cherry-pick `3b2f6c3`), plus coordinator test-only maintenance `2beff03` and `f353b1b` (local parent `ca827b6a3cea65dc92bba83200f84cc5c7c947ac`). Cherry-pick only this runtime commit; those prerequisite/test boundaries are separate.

## Failure and resulting behavior

Both energy controls retain their original integer domains: E1 30–80 keV and E2 40–140 keV. An exhaustive 5,151-pair scan finds **41 valid equal-energy singular pairs**, 40/40 through 80/80. Before this repair, 60/60 gave determinant zero and **zero finite entries out of 6,400 in both reconstructed thickness arrays**. The formatter printed em dashes while nonfinite arrays still reached the image renderer. These are valid hypothesis-failure examples, not malformed saved states.

The private two-material helper now classifies exact zero determinant as rank one and never divides by it. Equal measured equations have nonunique real linear solutions; unequal noisy measurements are inconsistent exact equations. The measured channels remain available. The two thickness panels explicitly say **No unique decomposition**, and the readout reports the actual count of matching versus inconsistent pixel equations. No singular thickness array or derived thickness metric is manufactured or rasterized: both arrays are `null` and those derived fields are absent. Physical nonnegativity is not asserted for the unconstrained real linear solutions.

All **5,110 nonzero-determinant offered pairs** still use the original inverse arithmetic with unchanged material coefficients, phantom, Poisson draws, domains, control inventory and reconstruction/window/statistic formulas. There is no arbitrary near-singular cutoff and no pseudoinverse substituted for the original problem. The closest nonzero pair, 80/81, has determinant approximately `0.0006515043321277392` and row-angle proxy `336.9810026273574`; it remains an invertible, visibly noise-sensitive case. The displayed row-angle proxy remains explicitly distinguished from a relative condition number.

The dose slider also had the inherited native-log mismatch: physical default 3,000,000 versus actual numeric native DOM `6.47999999752`, although its exact declared transform is `log10(3000000)=6.477121254719663`. A local native `step='any'`, initial resynchronization and post-input resynchronization now preserve exact continuous physical restores while retaining two-significant-digit physical rounding for real native input. No shared runtime changes.

## Narrow statement and scope correction

The original combined matrix/vector display clipped in the strict-built 320 px page even though the wider harness text fit. The same two-material equation now gives the coefficient matrix separately and defines its two short column vectors inline. The literal hypothesis `det A != 0` is retained. Its actual strict-built statement and scope fit at 320 px in both themes.

The proof's opening sentence now qualifies independence by distinct bone/tissue attenuation ratios. Its actual pma-9.36 determinant criterion and nla-3.1 relative-data-conditioning explanation remain. The caption and scope describe the explicit unavailable singular panels, replacing the temporary inherited-division warning after the guard was implemented. This is runtime/prose repair, not a historical-source acceptance.

## Mathematics and preservation

`node --test tests/verification-imaging-dual-energy.test.mjs` passes five new groups:

- all 5,151 offered energy pairs: 5,110 finite inverses, known thickness recovery, forward residuals and an independent elimination comparison, plus 41 rank failures with consistent/nonunique and inconsistent measurement examples;
- the closest nonzero pair's actual noise amplification;
- positive proportional rank-one rows and exact compatibility;
- row-angle invariance under positive row rescaling, rather than silently labeling it relative conditioning;
- rejection of nonpositive/nonfinite coefficient inputs and nonfinite measurements in the private helper.

An independently evaluated **80-digit mpmath oracle**, using the exact binary double coefficients and noisy data supplied to the JavaScript helper, verifies all 5,110 invertible pairs. Maximum scaled bone/soft error is **3.800813241189068e-14**. The 41 singular pairs are excluded from division rather than assigned finite inverse values.

The temporary explicit preservation audit compares all 48 written IMAGING objects against the prerequisite boundary. All **47 other complete objects/functions/source flags** are identical. For 2.9, all fields except the deliberately edited statement/idea/caption/scope/viz are identical, including both prerequisite additions and the source flag. The entire syllabus and every old chapter helper are byte-identical. The new helper is private to 2.9. No baseline JSON, default preservation guard, inventory, queue, MASTER, ledger or ownership file changes.

## Fresh native controls, saved state and actual pixels

`IMAGING_DUAL_OUTPUT=<own output> node tests/verification-imaging-dual-energy.mjs` passes in **320 px light and dark**:

- all 41 valid singular energy pairs, alternating nodule types, accepted without restore notice and exactly replayed;
- actual measured arrays, exact pixel compatibility counts, finite cached numeric quantities, no singular bottom raster calls, and actual bottom-stage placeholder text;
- independent row-elimination checks at actual reconstructed pixels, including closest nonzero, reversed ordering and domain endpoints;
- six raw valid tuples, including continuous off-grid dose `pi*1e6` and values within one ULP of its endpoints, preserving exact physical state/replay;
- both energies reaching equality through real Home/Arrow keys, then separately each real pointer energy change followed by the other real keyboard control matching it;
- real dose Home/End/Arrow controls and three pointer positions, preserving physical two-significant-digit input and resynchronizing the actual logarithmic DOM thumb;
- seventeen malformed complete states per theme: fractional integer-energy inputs, out-of-domain values including one-ULP violations, null/string values and invalid dose. Each is validated before the core setter can round/clamp, reports a restore notice and rolls back the **whole** tuple and edited nodule to default;
- direct actual numeric DOM/model comparison, exact selector `aria-pressed` state, exact complete remount/replay of arrays/status/counts/readout/stage calls, no runtime/TeX/blank failure or nonfinite painted-color sample;
- actual strict-built statement/scope paint bounds at the production text width, as well as changed harness prose widths.

Producer personally inspected fresh four-panel outputs and readouts for default, 60/60 calcified, 80/80, and near-singular 80/81 in both themes, plus actual controls and strict-built statement/scope pixels in both themes. Singular panels clearly withhold inversion; nonzero near-singular panels retain the visibly noisy finite decomposition. The compact coefficient matrix and explicit hypothesis fit in the actual 320 px page.

Strict build: **6684 written / 6890 planned / 450 chapters / 85 collections, zero errors/warnings**, home **112719 gzip bytes**. Static IMAGING: **48 items, zero errors/warnings**. The entire IMAGING mathematical subset passes **70/70**, no fail/cancel/skip. An earlier run had 68/70, solely the two inherited exact-dependency regex assertions the coordinator subsequently corrected in `f353b1b`; no numerical/runtime test failed.

Evidence root `/tmp/atlas-imaging29-runtime/`: `before.log`, `energy-domain.log`, `coefficients.json`, `oracle80.json`, `oracle80.log`; `math.log`, `all-imaging-math-final.log`, `build.log`, `static.log`; `baseline-boundary.json`, `preservation.mjs`, `preservation.log`; final native `native-final.log`, `native-final/` and personally inspected `contact-<theme>-<state>.png`. Browser servers use OS-assigned ephemeral ports. All producer browsers/servers were closed before the coordinator's map timing quiet window.

Independent peer should archive the exact runtime commit with its prerequisite/test boundaries, inspect helper and consumer mathematics, rerun the meaningful math/native probes with its own evidence, inspect its own pixels, and verify the same bounded scope. Source/prerequisite acceptance remains separate.
