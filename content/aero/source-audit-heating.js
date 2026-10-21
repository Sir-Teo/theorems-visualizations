// NASA TFAWS2012 Aerothermodynamics Course, Lecture1 slides17,28–29.
// Cold-wall, fully catalytic Earth-air stagnation-point approximation.
export const EARTH_HEATING_K=1.7415e-4;
export const RADIATION_SIGMA=5.67e-8; // rounded value used in the worked source example
export function heatingState(density,radius,speed,emissivity) {
  const heatFlux=EARTH_HEATING_K*Math.sqrt(density/radius)*speed**3;
  const radiationTemperature=(heatFlux/(emissivity*RADIATION_SIGMA))**.25;
  return{density,radius,speed,emissivity,heatFlux,radiationTemperature,
    emitted:emissivity*RADIATION_SIGMA*radiationTemperature**4,
    kineticEnthalpy:.5*speed**2};
}
export const NASA_HEATING_EXAMPLE={density:3.1459e-4,radius:1,speed:3535,emissivity:.8};
