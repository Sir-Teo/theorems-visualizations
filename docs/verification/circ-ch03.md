# Circuits chapter 3 flagged-item review — 18 October 2026

Reviewed the three existing source flags: circ-3.5, circ-3.7 and circ-3.10.
Two are closed; the Jacobi historical attribution in 3.5 remains flagged.

The complete relevant authoritative text was read in
[Doyle–Snell, *Random Walks and Electric Networks*, author revision July 5, 2006](https://math.dartmouth.edu/~doyle/docs/walks/walks.pdf)
(derived from the 1984 Carus monograph), §1.3.5, pp. 49–51. This includes the
bilinear conservation-of-energy identity for a potential function and a
KCL-satisfying flow, the full statement and proof of Thomson's principle, and
the dual potential principle. Their historical reference [33] is Thomson–Tait
(1879); that older book was not read, so the credit now cites the verified
network formulation rather than making an additional 1848 Kirchhoff priority
claim. Temporary PDF/text: `/tmp/circ-sources/doyle.pdf` and `doyle.txt`.

| Item | Disposition |
| --- | --- |
| circ-3.5 | **Historical comparison open.** Matching-load power follows the displayed algebra, but the original efficiency claim was too broad. A Thévenin equivalent preserves terminal I–V behavior, not internal power consumption of an arbitrary source network. The 50% figure is now explicitly the efficiency of the equivalent ideal voltage source and its single series resistance. The existing Jacobi c.1840 attribution remains marked as secondary and flagged; no complete original Jacobi source was obtained. |
| circ-3.7 | Closed. The source's bilinear flow/potential identity yields the two-experiment equality directly; the displayed symmetric grounded conductance-matrix proof gives the same result. Explicitly require a unique solution and suppress other independent sources. Positive reciprocal resistors are sufficient; merely finding a dependent source in an equivalent model does not by itself prove nonreciprocity. The controlled-source illustration now reports singular DC matrices instead of accessing missing solution vectors. |
| circ-3.10 | Closed. Positive-resistance hypothesis, prescribed terminal flow, cancellation of the cross term and exact sum R delta-i-squared excess were checked against the complete source proof. The plot shows **excess** dissipated power, which is now stated. Removed the unsupported separate continuum-priority claim. |

`node tests/verification-circ3.test.mjs` passes three independent groups:
an internal-shunt counterexample with true efficiency 1/6 while the Thévenin
model gives 1/2; a T-network's exact transfer resistance, nonreciprocal controlled
source and singular feedback gain; and Kirchhoff current balance plus the exact
Thomson excess-power identity for multiple resistor sets and loop currents.

`node scripts/check.mjs circ/3 --static`: thirteen items, zero errors/warnings.

`CIRC_CHAPTER=3 node tests/verification-circ-browser.mjs` passed **six
item/theme checks, 42 slider endpoint sweeps and two actual pointer drags**.
It checks real KaTeX 0.16.11 via `installBrowserAssets`, all modes and native
controls, live browser/TeX errors and finite readouts. Results:
`/tmp/circ3-verification-browser.json`; screenshots:
`/tmp/circ3-verification-shots/`. All six default screenshots were visually
inspected together in `mosaic.png`; no chart/label issue was found.
