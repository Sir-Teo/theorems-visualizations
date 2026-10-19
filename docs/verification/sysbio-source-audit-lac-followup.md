# Systems biology lac bistability

Ready: **sysbio-4.5** in `content/sysbio/ch04.js`; flag retained for root integration. New helper and scoped math/native scripts use prefix `sysbio-source-audit-lac`. Existing ch04.shared.js unchanged; only this consumer imports the new root routine.

## Full primary source

Ozbudak, Thattai, Lim, Shraiman & van Oudenaarden, [Multistability in the lactose utilization network of Escherichia coli](https://www.hubrecht.eu/app/uploads/2017/11/2004-Ozbudak-E-Nature.pdf), Nature427 (2004),737–740, DOI10.1038/nature02298. Original four-page author-institute PDF `/tmp/atlas-sysbio-ozbudak2004.pdf`/`.txt`, SHA256 `c416ec098cd0c7f391c271652a0251cbadc8e7c1318970c0a19a127f847175df`. Printed=PDF+736. Full article read, including Methods and all figure captions. Figure2 personally inspected at `/tmp/atlas-sysbio-ozbudak-original.png`.

p737/Figure1 establishes TMG/LacY positive feedback and two reporters; p738/Figure2 distinguishes induced/uninduced history, switching boundaries and single-cell bimodality; p739/Figure4 shows engineered graded response and why feedback alone is insufficient; p740 Methods specifies strains, reporter microscopy, histories and media. The source measured fluorescence in roughly1000 cells per condition, not internal inducer histograms. Product equations, 200-cell heterogeneous equilibrium assignment and dimensionless parameters are explicitly separate chosen illustration. Unneeded Novick1957 original-specific attribution removed; no original1957 full access claimed.

## Corrections and proof

Replaced unsupported sufficiency claim “n>1 and strong promoter implies bistability” with conditional steepness, basal/leak and uptake requirements. The actual two-variable Jacobian has eigenvalues −1±sqrt(G′), making stable/saddle/marginal classification precise. n1 gives a unique positive root; slightly larger n can still be monostable for all shown e.

The old uniform sign-grid could miss two adjacent roots or a tangent fold. New scoped equilibrium solver partitions at the two analytic extrema of h(X)=B+A X^n/(1+X^n)−X; the gain derivative is unimodal for n>1 with maximum at X^n=(n−1)/(n+1). Each interval is monotone; bisection isolates its crossing and an explicit tangency check retains marginal roots. This is numerical isolation using analytic structure, with documented floating-point tolerance.

The left bifurcation diagram is parameterized directly by X and e=sigma/(1−sigma), sigma=X/[kappa(phi+alpha D(X))]. It does not connect the lower stable branch to an upper branch across missing grid samples. The histogram range adapts to all cells; old upper endpoint1.3 could clip a culture at alpha30/high e. Readout counts assigned lower/upper branches only for cells with two strictly stable roots, plus single/marginal cases. A large range alone no longer asserts two modes or measured population dynamics.

## Validation

`node --test tests/verification-sysbio-source-audit-lac.test.mjs`: **5 groups pass**. Independent integer-polynomial root isolation across60 parameter combinations; exact constructed tangent fold plus close-root sides; independent Jacobian/determinant and n1/n1.1 counterexamples; every parametric branch equilibrium/stability structure; all200 cells accounted, including values beyond the old histogram cutoff and history ordering.

`node tests/verification-sysbio-source-audit-lac.mjs`: **2 groups pass**, light/dark. Actual18parameter combinations ×3histories per theme. Every plotted branch point satisfies its equilibrium; root counts match; all histogram bin probabilities sum to1; full high-expression tail visible; no page/TeX errors. Personally inspected `/tmp/atlas-sysbio-lac-all-high-cells-visible-light.png` and `/tmp/atlas-sysbio-lac-separate-fold-branches-dark.png`.

The final wording clarification scopes history dependence to a bistable window; no computation changed. No original-data fitting, universal lactose bistability, subjective listening closure or Wave5 work.
