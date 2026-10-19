# Buoyancy frequency: agent sample finding

`geo-1.4` now separates the pressure-adjusted parcel model from the
small-displacement linearization of its buoyancy. Large excursions can
violate the sinusoidal/exponential approximation while pressure adjustment
remains an assumption of the model. Its former scope sentence mixed these
ideas. The dry ideal-gas and no-mixing conditions are explicit.

The statement also identifies the Boussinesq density formula's reference
density. Compressible seawater needs an adiabatic density correction; its
raw in-situ gradient alone is insufficient. Neutral motion is constant
velocity, with a stationary displacement only for release from rest.
Unstable linear motion has both growing and decaying modes; the simulated
release from rest gives the stated cosh trajectory. The two illustrative
periods are tied to explicit temperature/lapse-rate choices.

Visual follow-up found that the left plot joined only the two endpoint
values of the nonlinear dry adiabat. It now samples the pressure-adjusted
curve at 81 heights. Its temperature range also accommodates the inversion
endpoint: at Γ = −8 K/km the parcel curve reaches approximately 42 °C,
beyond the old 32 °C right edge. The caption identifies the simulated
hard boundaries at 0 and 3 km and the unbounded linear reference.

Validation: native inputs in both themes cover stable, inversion,
unstable and zero-displacement states. Predicted periods are compared
with an independent evaluation of g/T (g/cp − Γ), rather than a copy of
the finite-difference θ calculation. All eight captures were inspected;
real-TeX/runtime checks pass. Strict build and current sample hashes pass.
The simulation integrator and physical constants are unchanged. This
follow-up adds no source closure or prerequisite edge.
