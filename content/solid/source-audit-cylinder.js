// Axisymmetric homogeneous linear elasticity; tension-positive stresses.
export function cylinderStress(ratio, inside, outside, inner=1) {
  const outer=ratio*inner, gap=outer*outer-inner*inner;
  const A=(inside*inner*inner-outside*outer*outer)/gap;
  const B=inner*inner*outer*outer*(inside-outside)/gap;
  const radial=r=>A-B/(r*r), hoop=r=>A+B/(r*r);
  const force=inside*inner-outside*outer;
  return {inner,outer,A,B,radial,hoop,axial:A,force,average:force/(outer-inner)};
}
// Geometric comparison for nonzero internal pressure with zero external pressure.
export const cylinderThinRatio=ratio=>2*(ratio*ratio+1)/(ratio+1)**2;
