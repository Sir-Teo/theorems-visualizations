/** Well-stirred organ model; flows, clearance and unbound fraction use blood as reference. */
export function hepaticExposure(Q, capacity, absorbed = 1, gutSurvival = 1, dose = 1) {
  const clearance = Q * capacity / (Q + capacity), survival = Q / (Q + capacity);
  return { clearance, survival, extraction: 1 - survival, availability: absorbed * gutSurvival * survival,
    oralAUC: absorbed * gutSurvival * dose / capacity, intravenousAUC: dose / clearance };
}
/** Future AUC from mass balance: central drug plus drug still awaiting absorption, divided by clearance. */
export const oralTailAUC = (concentration, availability, dose, volume, absorptionRate, eliminationRate, time) =>
  (concentration + availability * dose / volume * Math.exp(-absorptionRate * time)) / eliminationRate;

/** Linear whole-blood organ clearance and logarithmic elasticities. */
export function hepaticModel(Q, capacity, model='ws') {
  if(model==='ws'){const clearance=Q*capacity/(Q+capacity),extraction=clearance/Q;return{clearance,extraction,flowElasticity:extraction,capacityElasticity:1-extraction};}
  const z=capacity/Q,extraction=-Math.expm1(-z),capacityElasticity=z>700?0:z/Math.expm1(z);
  return{clearance:Q*extraction,extraction,flowElasticity:1-capacityElasticity,capacityElasticity};
}
