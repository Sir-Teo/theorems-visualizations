# Continuous approximation in L2

The indicator approximation in `pma-11.38` used m(V-F)<eps to conclude
an L2 error below eps. The proof now chooses m(V-F)<eps² and explicitly
handles empty F with g=0. Choosing bounded open V in the real line also
keeps its complement nonempty for the distance formula.

The interval example's uniform error is 1/2 for separated ramps, rather
than near 1 as claimed. The fat-Cantor option is a nine-stage finite union,
not the nowhere-dense limiting set. Its measure is 1/2+2^-10; the remaining
removed measure is 2^-10, giving indicator L2 distance 1/32 from the limit.
The page explains refining the stage and the triangle-inequality bound.
The 20,000-midpoint norm estimate and sampled maximum are labelled as
numerical estimates. A sampled maximum does not certify a supremum.

Twelve controlled native states cover both set choices and the default,
minimum and maximum eta in both themes. All captures were inspected;
runtime, TeX and finite-value checks pass. For separated interval ramps,
integrating four boundary errors gives squared norm 2eta/3, independently
confirming the default numerical norm .1826 at eta=.05. Native selector
and keyboard endpoint controls pass. The temporary check initially used
the wrong coordinate convention for a logarithmic slider; the final check
uses the actual default and native Home/End controls.

Artifacts are `/tmp/agent-review/l2-density-browser.{mjs,json}`, named
PNGs and the light/dark native mode reports. The mathematical correction
changes no quadrature or approximation algorithm. Strict build and current
review hashes are checked before commit.

The accompanying visual pass records 43 new findings from sample positions
229–276, omitting already inspected pages and the definition without a
visualization. Pending semantic/control issues remain explicitly recorded;
these findings do not close full-page or human-review gates. Two capture
artifacts were replaced with inspected isolated recaptures and documented.
