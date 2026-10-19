# Renewal iteration indices and numerical errors

`prob-2.6.4a` started from H₀=h but gave a partial sum over n<k.
Its unchanged recurrence actually produces Hₖ=Σₙ₌₀ᵏh*F⁎ⁿ. The explanation
now includes the initial term, and strictly positive interarrivals are
explicit in the definition.

The readout called a sampled maximum a continuous supremum and gave a
general grid-cost heuristic even for discontinuous box forcing. It now
labels the grid maximum, approximate grid solution and infinite-time
limit separately. For Gamma(shape2,rate2), the residual-life limit is
∫₁∞e⁻²ˢ(1+2s)ds=2e⁻²; the widget uses that exact expression instead of
truncated numerical integration. Its grid endpoint .2727 and limiting
value .2707 are explicitly distinct. Grid recurrences are unchanged.

All 18 cases (three forcings × k=0/4/25 × two themes) passed native controls,
finite-readout and runtime/TeX checks, and were captured again after fresh
page loads. Captures were inspected, including individual files where
montage views were ambiguous. H₀ equals the forcing; k=25 approaches the
dashed grid solution, without claiming zero continuous-time error from
a rounded readout. Eleven existing probability verification groups pass.
Artifacts: `/tmp/agent-review/renewal-browser.{mjs,json}`,
`renewal-isolated-browser.{mjs,json}`, named PNGs and
`renewal-prob-tests.log`. Strict build, review hashes and packets are
checked before commit. Source, human-review and listening counts are unchanged.
