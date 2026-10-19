# Three local conditional-capture corrections

The agent visual review identified three small presentation defects. The parent authorized narrow local corrections; no values, numerical algorithms, source flags, shared runtime, checker, inventory or runner were changed.

- **CPLX2.6:** caption now identifies red exclusion shading, the green feasible LP polygon or segment, the gold optimum, and the red triangular clause-cut planes in the cube.
- **LOGIC5.13:** the scientific-notation error bound now has math delimiters. The absolute-value conditional state renders the tiny numerical error in actual KaTeX rather than displaying a literal TeX command.
- **PCHEM2.12:** reference and zero-level annotations now use the actual projected separation of their lines. When the lines are less than60 screen pixels apart, the two labels move beyond the outer levels, with backing plates; ordinary spacing remains when they are farther apart. This resolves ammonia's near-zero target and also handles MgO and lattice-slider endpoints without changing enthalpies or bars.

Validation on2026-10-19: `node scripts/check.mjs cplx-2.6 logic-5.13 pchem-2.12 --static --fail-on-warnings` passed3items with0errors/0warnings. Existing `node --test tests/verification-pchem.test.mjs` passed. No new numerical result is introduced by these presentation changes.

`node tests/verification-conditional-energy-fixes-browser.mjs` passed **50 settled states** serially in both themes with pinned local KaTeX0.16.11. CPLX covers2D, cube, a clause change and restoration. LOGIC types `abs(x)`, checks both infinitesimal signs and verifies scientific-notation TeX does not leak outside rendered math. PCHEM covers all4salts, each lattice minimum/zero, zero revealed steps, all3bond reactions and Born–Haber restoration. Instrumentation records actual production annotation positions and asserts more than24pixels between label centers, more than9pixels from both level lines, and positions inside the stage. No blank canvas, runtime error, TeX error or nonfinite readout occurred.

The agent inspected all50updated PNGs in10contact sheets, including every PCHEM reaction/mode and both themes. Captured context and labels are readable; no remaining defect was observed in these focused states. This is agent inspection, not the human339sample. Machine evidence, source-file hashes and every PNG SHA256 are recorded in `conditional-energy-fixes.json`; original captures and contact sheets are under `/tmp/conditional-energy-fixes/`.

An initial native check caught another compressed annotation case in MgO, so the projection-gap threshold was increased before the complete successful focused rerun. The final static pass follows that correction. The three sources are now frozen; the parent owns final full-collection refreshes for CPLX, LOGIC and PCHEM. No full collection sweep was launched by this reviewer.
