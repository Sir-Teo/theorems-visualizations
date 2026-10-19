# Planck-response explanation: sample review finding

The user-authorized agent review of `climate-3.4` found an arithmetic
contradiction in the explanation: the assessed response 3.22 W m⁻² K⁻¹
does not lie between the quoted black-body slopes 3.8 and 5.4. The syllabus
also incorrectly described 3.2 as the derivative of σT⁴ at 255 K.

The explanation now separates three calculations:

- The black-body derivative 4σT³ is 3.7609 at 255 K and 5.4181 at 288 K.
- A fixed-effective-emissivity grey-body estimate has slope 4 OLR/Ts,
  giving 3.3194 for OLR = 239 W m⁻² and Ts = 288 K. This is a simplified
  estimate, not the calculation underlying the AR6 assessment.
- The separately assessed AR6 all-sky response remains 3.22, giving
  3.93/3.22 = 1.2205 K for the stated doubling forcing.

The existing scope already distinguishes the synthetic clear-sky column,
uniform warming including the stratosphere, fixed-relative-humidity
feedback, and the assessed all-sky response. Those distinctions remain
explicit. The syllabus now describes the actual comparison and mirrors
the forcing-definition prerequisite used in the written page.

Validation: strict build, existing climate numerical regressions, the
336 visualizations in the 339-page sample passing static validation, and
a fresh native dark-theme render with real KaTeX. The diagram was inspected:
it distinguishes the two column responses, black-body curves and assessed
reference bars. Both review worksheets were regenerated for the changed
build. No original-source flag is closed by this explanation correction;
it is an agent finding, with no human-review or listening credit.
