# Minkowski gauge: origin, boundary and ray geometry

In `fa-1.33`, visual review found a strict “t > μ” membership label even
though the caption described a smallest dilate reaching the point. Further
inspection found numerical and geometric defects:

- At x=0 the normalized ray divided by zero and the gauge became infinity,
  although 0 belongs to every positive dilate of each pictured set.
- The purported boundary disc had centre (0.75, 0.1) and radius 0.76.
  Its centre's norm is approximately 0.756637, so 0 is inside it and
  the disc is absorbing. The declaration that it was not absorbing
  contradicted its geometry.
- Testing 800 ray points at spacing 0.005 could miss this small interior
  region, returning infinity rather than finding its boundary.
- The segment accepted a narrow angular cone as if it lay on its line.

The replacement boundary disc is exactly tangent at 0: centre (a,0)
and radius a=0.75. For a nonzero point (x,y), its gauge is
(x²+y²)/(2ax) when x>0, and infinity when x≤0. This follows directly
from the disc inequality for (x/t,y/t); the endpoint is included because
the disc is closed. The segment likewise absorbs only its actual line.
The two polygons use their edge/ray intersections instead of the coarse
sampling search. No other page's gauge algorithm was changed.

Every pictured example is now explicitly closed. For a nonzero point
with finite gauge, membership holds for t≥μ, with the displayed value
rounded. At the origin the gauge is zero and all t>0 work; the undefined
point x/μ is omitted. Snapping makes the origin and segment axis
accessible by dragging. The star is identified as a nonconvex radial
gauge example rather than a seminorm guarantee.

Validation: three independent numerical groups compare a rectangular
norm, disc-boundary membership on both sides of the computed threshold,
zero in all shape types, and nonzero near-axis segment points. The native
browser regression drags the actual handle through 20 states across
both themes, including every mode at the origin, inward/outward disc
rays, and on/off-axis segment points. Runtime and real TeX pass. All
controlled and mode captures were inspected. Strict build, current sample
hashes and the full regression suite pass.

The sample now has 276 semantic text reviews. This item was already
visually inspected and adds no duplicate visual credit; it gains an
instrumented interaction review. No source flag or prerequisite
shortfall is closed by this correction.
