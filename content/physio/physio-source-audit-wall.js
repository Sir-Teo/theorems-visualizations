// Instantaneous spherical geometry; cm³=mL. Pressure/stress use a common unit.
export function sphereWall(cavityVolume, wallVolume) {
  const ri=Math.cbrt(3*cavityVolume/(4*Math.PI)),ro=Math.cbrt(3*(cavityVolume+wallVolume)/(4*Math.PI)),h=ro-ri;
  return {ri,ro,h,ratio:h/ri};
}
export function wallStress(pressure,geometry) {
  const {ri,ro,h}=geometry,thin=pressure*ri/(2*h),cut=pressure*ri**2/(ro**2-ri**2);
  return {thin,cut,relativeExcess:h/(2*ri)};
}
