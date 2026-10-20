# PHARM4.2 elapsed time after the first dose

Separate authorized suffix-only successor to `387edec7f20e5ff549eac153a9f9d3539286d2f7`. The minimal peak index n90 is unchanged. Since peak n occurs at (n−1)tau when the first bolus is at time zero, the readout now reports (n90−1)·tau/t_half half-lives after that first dose, replacing the unconditional about3.3half-lives suffix. No accumulation, bar, control, fitting, helper, flag or dependency calculation changes.

The exact one-literal allowance is `tests/pharm-accumulation-time-manifest.json`. Its explicit probe reconstructs all21source files and checks minimal-index inequalities r^n90≤.1<r^(n90−1) over all119 offered .05 ratio-grid values from.1 to6, plus exact offered examples ratio1→n90=4→elapsed3 and ratio6→n90=1→elapsed0. Floating products are compared with their rational-grid elapsed coordinates within1e−12, rather than asserting bitwise associativity of floating arithmetic.

Fresh real-keyboard ratio1/6 and dose1 controls in both320px themes show those actual elapsed times. All four readouts and four complete visualization/control cards fit with no TeX/page errors and were personally inspected. Evidence `/tmp/atlas-pharm-prereqs/accumulation-time-native`, accumulation-time-{guard-math,native}.log. Browsers closed. Final combined strict/preservation checks follow; no source closure or independent acceptance is asserted.
