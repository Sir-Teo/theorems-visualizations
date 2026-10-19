# Louisville's 2020 population units

The [official Kentucky incorporated-place table](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs26/tigerweb_acs26_incplace_2020_tab20_ky.html)
was read with its header and full Louisville rows. It reports `POP100`
246,161 for Louisville city (GEOID 2148000) and 386,884 for the
Louisville/Jefferson County metro government balance (2148006). The sum
is exactly the existing plotted 633,045. Download SHA256:
`5a9931e38dc7084b034e800628cb493047a56da49f3fe725d658c9697bfd9f89`.

The [Census geography glossary](https://www.census.gov/programs-surveys/geography/about/glossary.html),
complete *Consolidated City* section, explains that a balance record
excludes separately identified places. The two rows can therefore be
combined without counting a resident twice. This is an explicitly chosen
aggregation, rather than a claim that either row has changed its population.
The [consolidated-government table](https://tigerweb.geo.census.gov/tigerwebmain/Files/acs25/tigerweb_acs25_concity_2020_tab20_ky.html)
reports 782,969 for the full government, a different unit.

The page now labels the Louisville point as *city + balance*, supplies
both component counts and GEOIDs, and distinguishes the aggregate from the
standalone balance, full consolidated government and metropolitan area.
The plot is described as 30 large municipal/consolidated-city units; it
does not imply an exhaustive ranking under a uniform boundary definition.
The source table rows, retrieval hashes and arithmetic are recorded in
`soc-louisville-reconciliation.json`. Earlier QuickFacts evidence is retained
as an accurate record of the separate 386,884 balance figure.

All 30 plotted cells were compared with the 29 previously verified official
records plus this aggregate; all match exactly. Numerical values, ranks,
the fitted empirical slope and simulation are unchanged. Exact references
are mirrored in the syllabus. `soc-4.13` is closed for the qualified
geographic presentation. The earlier full Gabaix reading remains the
evidence for the growth model; this closure concerns the outstanding data
provenance gap.

Validation: existing sociology regressions, strict build, focused static
and native controls in both themes, source ledger reconciliation and the
current-build human worksheet. No human-review credit is assigned.
