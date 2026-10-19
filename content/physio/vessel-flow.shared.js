/** SI rigid circular-tube model. Density defaults to the illustrative blood value. */
export function poiseuille(radius, length, viscosity, pressureDrop, density=1060) {
 const peak=pressureDrop*radius*radius/(4*viscosity*length),flow=Math.PI*radius*radius*peak/2;
 return { peak, flow, mean:peak/2, shear:pressureDrop*radius/(2*length), reynolds:density*peak*radius/viscosity, aspect:length/(2*radius), velocity:r=>peak*(1-r*r/(radius*radius)) };
}
export const pulseSpeed = (modulus, thicknessRadiusRatio=.1, density=1060) => Math.sqrt(modulus*thicknessRadiusRatio/(2*density));
export const reflectedDelay = (length, site, speed) => 2*(length-site)/speed;
