# Systems biology temporal programs

Ready for root integration: **sysbio-3.8 and sysbio-3.9**, both in `content/sysbio/ch03-b.js`. Source flags retained for atomic integration. New scoped helper `sysbio-source-audit-programs.shared.js`; no existing shared helper changed in this subset.

## Full primary sources

- Shen-Orr, Milo, Mangan & Alon (2002), [Network motifs in the transcriptional regulation network of Escherichia coli](https://www.metabolic-economics.de/pages/seminar_regulationsnetze_2005/literatur/Shen-Orr_2002_Motifs_EColi_Nat_Genet.pdf), original complete five-page advance-online article, DOI10.1038/ng881. Cache `/tmp/atlas-sysbio-shenorr2002.pdf` and `.txt`; SHA256 `1681422452f68a1b0c8253c89f81f572515ff459900df56a7aae9cc5148f6c13`. Figure1c/definition pp1–2 require one regulator, same edge sign, no additional transcriptional input; p3/Figure2b describes the theoretical LIFO program; Methods p5 specifies Boolean production/common removal and the chosen original thresholds. Full text read; Figure2b personally inspected in `/tmp/atlas-sysbio-shenorr-sim-original.png`. Product does not claim the original's parameterization was reproduced.
- Kalir, Mangan & Alon (2005), [A coherent feed-forward loop with a SUM input function prolongs flagella expression in Escherichia coli](https://www.metabolic-economics.de/metabolic-economics/pages/seminar_regulationsnetze_2005/literatur/Kalir_2005_FFL_MolSysBiol.pdf), Molecular Systems Biology1:2005.0006, DOI10.1038/msb4100010. Cache `/tmp/atlas-sysbio-kalir2005.pdf` and `.txt`; SHA256 `77988fb3e1aecfdc67784754ab9956a0895e3ea573c2cdead856aa31582e11a2`. All six pages read. E1–E2/Figure1 distinguish additive SUM from Boolean OR approximation and establish FlhDC/FliA/fliL wiring; E3/Figure2 compares fliA-present/deleted strains under induced FlhDC ON/OFF; E4/Figure3 gives native-promoter control and discusses autoregulation/FlgM checkpoint/qualitative-model limitations; E6 appendix conditions slower decay on stable positive autoregulation. Original Figure2 and text rendered/inspected `/tmp/atlas-sysbio-kalir-original.png`.

The unnecessary Zaslaver2004 amino-acid timing and Kalir2001 original-specific claims were removed from these entries: no full-text access to those originals is asserted. Neither entry is a Paper entry requiring retention of a named original. SIM mathematical program is attributed to the fully read Shen-Orr original; SUM-FFL biology is attributed to the fully read Kalir2005 original; the three-target OR design is explicitly derived here.

## Corrections and mathematical evidence

3.8: restored same-sign SIM definition. Removed false claim that fast input reverses ordering in the displayed equal-kinetics system. Its positive exponential convolution preserves the input's pointwise threshold order at every speed, so complete upward half-level crossings occur E1→E4 and downward E4→E1. General biology with unequal kinetics is separately scoped. Removed universal ln2 lag after a moving graded threshold. Production switching, regulator crossing and reporter half-level crossing are distinct. Weak/short pulses and finite-window censoring do not imply zero expression or never-on.

3.9: explicit sufficient conditions for sharp-OR FIFO: X must control first activation crossings and Y final deactivation crossings, with all thresholds attained. Activation is the earlier of input crossings; deactivation the later. Design label and rate alone do not guarantee that dominance in a graded finite pulse. The real original measured a SUM-FFL OFF delay, not a three-target FIFO law. The bounded independent OR a+b−ab, thresholds and concentrations are chosen illustration; feedback/checkpoints are omitted. Corrected the wrong time-axis normalization: actual removal rates are1.5,1.5×ratio,4 per model unit.

Both displays now use exact prescribed exponential X and RK4 downstream dynamics. Independent quadrature exposed an underresolved high-rate SIM onset with a plain .01 step, so SIM uses additional RK4 substeps scaled to the regulator rate while retaining the .01 plotting grid. Directional interpolation now distinguishes late rises from actual OFF falls; old direction-agnostic crossing could label a rise after withdrawal as OFF. Missing events explicitly mean not observed in the finite20/24-unit window.

## Validation

`node --test tests/verification-sysbio-source-audit-programs.test.mjs`: **6 groups passed**: exact pulse/threshold phases; rise-vs-fall regression and censoring; positive-kernel ordering at27 parameter combinations including fastest regulator; independent20,000-panel Simpson convolution for all4 SIM reporters at5 times/3 regimes; independent full5-variable midpoint integration at20× finer time resolution across8 multioutput corners; min/max sharp-OR dominance fixture and refinement.

`node tests/verification-sysbio-source-audit-programs.mjs`: **4 browser groups passed**, both entries in light/dark. Actual sliders exercise all8 SIM corners and both FFL threshold designs at all rate/duration extremes. Every plotted regulator/reporter point, directed crossing-dot count, order and incomplete-window readout verified. Default actual FIFO and fast SIM order preserved. No page/TeX errors or NaN/Infinity readouts. Screens personally inspected:

- `/tmp/atlas-sysbio-programs-SIM-fast-order-preserved-light.png`
- `/tmp/atlas-sysbio-programs-FFL-fast-different-order-dark.png`

Default and incomplete-window opposite-theme screenshots retained. No empirical fit, universal biological timing guarantee or Wave5 work.
