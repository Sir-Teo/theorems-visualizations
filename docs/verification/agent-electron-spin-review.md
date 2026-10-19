# Electron spinor: agent sample finding

`qchem-2.7` claimed an electron's full wavefunction is always a product
of spatial and spin factors. A general nonrelativistic pure state is
instead a two-component spatial spinor. If its two spatial components
are not proportional, it cannot be written as one spatial function
times one fixed spin vector. Stern–Gerlach separation supplies a direct
example: an initial spin superposition becomes correlated with two
different spatial packets.

The statement now gives the general spinor and identifies the product
form as a special case. The standalone spin-vector description is
explicitly for a pure spin state, and the tilted-measurement example
specifies an up-z preparation and includes the outcome's ħ unit. The
idea also corrects “half-integer number of projections”: the number
two is an even count, while the spin quantum number is half-integer.
Reading its `qchem-1.9` prerequisite found the same projection/direction
confusion: its 2J+1 outcomes are now identified as measured z projections,
rather than sharply defined three-dimensional rotor-axis directions.
That adjacent prerequisite correction adds no sampled-page review credit.
Its polar plot is also labelled angular amplitude, matching |Y|, rather
than calling that magnitude a probability density.

The figure also conflated allowed deflections with occupied spots: a
prepared beam aligned with the axis occupies just one of its two spin-half
outcomes. Caption and readout now distinguish them. The classical-model
readout no longer makes a universal claim excluding every classical
distribution with separated groups; it describes the chosen ensemble.
The angular-momentum-one comparison uses m rather than the electron's m_s.

Validation: existing spin-half and measurement formulations compared;
strict build and native mode rendering in both themes with real TeX.
The eight spin captures and four rotor captures were inspected, as were
aligned prepared-spin captures in both themes. Additional native input
checks give prepared-spin probabilities 100/0, 50/50 and 0/100 at 0°, 90°
and 180°, with the readout correctly retaining two allowed deflections
when only one is occupied. The simulations, probabilities and source
flags are unchanged.
