# Childhood mortality and life expectancy

`demo-2.9` claimed that infancy and childhood overwhelmingly explain
historical life-expectancy differences. Its default illustrative schedule
contradicted that claim: replacing rates below age 5 raises e₀ from 33.4
to 49.8, closing 33% of the 49.7-year gap to Sweden 2019 (83.1).
The China 1990, USA 1950 and Sweden 1950 examples close 24%, 16% and
15%, respectively. Both childhood and later-age rates matter.

The item and syllabus now describe the comparison without a universal
historical attribution. The statement identifies the default number as
model-specific. The explanation distinguishes an order-dependent schedule
replacement from a causal intervention or an exact additive decomposition.
The scope describes grouped-table assumptions without an unsupported
bound on discrepancy from published tables. The caption identifies the
retained 85+ rate: the slider replaces closed age groups below the cut-off,
so its maximum at 85 need not reach the comparison population's e₀.
Numerical life-table code and source flags are unchanged.

All 24 native states (four populations × cut-offs 0/5/85 × both themes)
passed runtime, finite-readout and TeX checks; all captures were inspected.
Two existing demography verification groups pass. Artifacts are
`/tmp/agent-review/demo-life-browser.{mjs,json}` and named PNGs.
Strict build, review hashes and generated review packets are checked before
commit. No human-review, original-source or listening credit is claimed.
