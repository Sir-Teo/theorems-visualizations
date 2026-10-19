/** Original Cockcroft–Gault units; the impairment model caps normalized function at one explicitly. */
export function renalScaling(age,weight,serumCreatinine,female,renalFraction,normalClearance=120) {
 const creatinineClearance=(140-age)*weight/(72*serumCreatinine)*(female ? 0.85 : 1);
 const kidneyFraction=Math.min(creatinineClearance/normalClearance,1);
 return { creatinineClearance,kidneyFraction,clearanceFraction:1-renalFraction*(1-kidneyFraction) };
}
