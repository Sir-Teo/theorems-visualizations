# Wave 5 fluid chapter 5 — independent review

Accepted by root on 2026-10-21: all eight new items, their isolated helper and numerical tests. Earlier chapters and historical review work were outside this review.

## Sources and mathematical checks

Read the actual [MIT 18.354 lecture notes](https://ocw.mit.edu/courses/18-354j-nonlinear-dynamics-ii-continuum-systems-spring-2015/6163837c5efa5d6ed969e535ec8f890c_MIT18_354JS15_lectureNotes.pdf), §§17.2, 18.4–18.5, 19.3 and 20.1–20.4. The authored clockwise-positive circulation reverses the source's circulation convention consistently. Corrected references to the map and lift derivation: §19.1 concerns Cauchy–Riemann equations, whereas the relevant Joukowski and force results are in §§19.3 and 20.1–20.4. The [MIT F20 notes](https://ocw.mit.edu/courses/16-01-unified-engineering-i-ii-iii-iv-fall-2005-spring-2006/f790501546695cacc137229c5df03511_f20.pdf) support smooth flow-off as the added selection condition.

Also consulted the [Sydney thin-aerofoil exposition](https://www-mdp.eng.cam.ac.uk/web/library/enginfo/aerothermal_dvd_only/aero/thinaero/thinaero.html), [NASA's equal-transit explanation](https://www.grc.nasa.gov/WWW/k-12/VirtualAero/BottleRocket/airplane/wrong1.html) and [NASA's induced-drag explanation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/induced-drag-coefficient/). The chapter correctly separates inviscid section predictions, linear thin-aerofoil predictions, constructed finite-wing loadings and a prescribed starting-circulation budget. None is presented as a viscous startup or stall solver.

Independently derived the real-coordinate surface velocity, without calling the production complex-velocity routines for the expected value. On the circle, the tangential velocity is `vθ = −2 sin(θ−α) − Γ/(2πR)`. Convert to Cartesian components and apply the map Jacobian divided by its squared modulus. Compared both components against the production surface velocity at 1,008 states: d in {0.02,0.12,0.22}, h in {−0.15,0,0.15}, α in {−0.2,0,0.13,0.21}, circulation fractions {0,0.4,1,1.5} and seven nonsingular circle angles. Maximum scaled component error was 3.54e−14.

Independently expanded the polynomial camber slope after substituting X=(1−cosθ)/2: `4m cosθ + r(1/4 + 3 cos(2θ)/4)`. This gives the displayed A0, A1 and A2, and the lift and nose-up quarter-chord moment follow with the declared convention. Checked the pressure-contour orientation and projection into stream-normal/streamwise directions. Reran all eight focused mathematical tests: all pass, including pressure and trajectory refinement, surface flux/circulation, wake budget and span-integrated induced drag.

## Native and visual acceptance

Final independent root run: `node tests/wave-five-native.mjs fluid`, log `/tmp/atlas-wave5-root-fluid-final-native.log`: **32/32** item/theme/width groups pass, with **180 real control actions**, at 1200px and 320px in both themes. This checks real endpoints/options, live readouts, TeX, canvas bounds and page overflow. An earlier candidate run is retained separately and is not additional coverage.

Independently opened all eight default items across desktop/narrow and light/dark examples. Initial review found and requested repairs to a TeX title escape, circle extents, inaccurate source-section pointers, a clipped wake label and axis labels crossing curves. The author repaired them, explicitly labeled the cambered chord as sampled, added external axis gutters, and disclosed the log-speed floor and true stagnation zeros. Inspected the final 5.3 light320, 5.5 dark320, 5.7 dark320 and 5.8 light1200 recaptures after the gutter/label fixes. Their diagrams, tick labels, controls and readouts are clear.

The finite pressure extrema remain sampled; the log plot intentionally omits speeds below 0.01U; the transit integrator stops at a declared arrival plane; wake convection and circulation growth are prescribed. These are visible model limits, not hidden substitutes for the claimed physics. Source, mathematics, computational honesty and visual presentation meet the chapter acceptance bar.
