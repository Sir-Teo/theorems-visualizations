# Coordinate midpoint rates: agent sample finding

`vcalc-4.7` claimed both adapted coordinate sums converge as N⁻²,
and that both have constant ball-integration limits. Spherical
coordinates have a rectangular parameter region. Cylindrical
coordinates have z limits ±√(1−r²); the implemented sum integrates
z and angle exactly, then applies radial midpoint quadrature to
4πr√(1−r²), or 4πr³√(1−r²) for the second moment.

The square-root endpoint gives an N⁻³ᐟ² leading error, while the
smooth spherical integrands give N⁻². Independent evaluations at
N = 64,128,256,512,1024 yield doubling rates approaching 1.5:
volume 1.521 to 1.508, and second moment 1.490 to 1.499.
The Cartesian boundary-cell argument gives an O(1/N) error bound,
with oscillations rather than a uniform observed slope.

The idea and caption now describe these three behaviours, and the
plot has a separate 1/N^(3/2) reference. The ball comparison explicitly
names Cartesian, cylindrical and spherical systems, distinguishing
it from the earlier list that also includes two-dimensional polar
coordinates. The midpoint calculations themselves are unchanged.

Validation: independent radial sums for both integrands, strict
build and native mode checks in both themes. All eight captures
were inspected, covering the three coordinate modes and the second-
moment switch. At N = 8 the volume readouts are 4.37500, 4.24276
and 4.19936 against 4.18879; the spherical second moment is 1.65331
against 1.67552. The new guide and the different error slopes are
visible. No original-source or prerequisite count changes.
