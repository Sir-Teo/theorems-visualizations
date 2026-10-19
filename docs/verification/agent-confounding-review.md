# Confounding, identification and the target effect

`epi-4.6` asserted that common-cause structure necessarily makes crude
and causal risk ratios differ, and that adjusting for a confounder
unconditionally removes bias. The statement now gives the consistency,
conditional-exchangeability and positivity assumptions required by
standardization, including positive baseline causal risk for the ratio.
It allows parameter choices where numerical bias vanishes and distinguishes
one adjusted variable from a sufficient adjustment set.

Mediator and collider warnings now depend on the full causal structure and
the target effect. In the illustrated mediator model the slider controls
the direct E–D factor; the green line includes the mediated path and
therefore reports the total effect. The control, caption and scope now
make this distinction. The readout no longer labels every comparison
within 2% “unbiased”; it reports the actual tolerance.

Joint-probability and estimation code is unchanged. Thirty native states
cover all three roles, crude/adjusted analyses, each C link neutralized,
and direct effect 4, in both themes. All captures were inspected; runtime,
TeX and neutral-link checks pass. At the default direct factor 1, mediator
total effect is 1.56 and its adjusted ratio is 1. At direct factor 4 the
total is 6.25. Collider adjustment gives .65 against true total 1;
neutralizing either C link removes that discrepancy.

Six existing epidemiology math/source verification groups pass. Artifacts:
`/tmp/agent-review/confounding-browser.{mjs,json}` and named PNGs. The first
native assertion expected Markdown asterisks in rendered text; correcting
that assertion required no product change. Strict build, review hashes
and packets are checked before commit. No source, human-review or
subjective-listening credit is claimed.
