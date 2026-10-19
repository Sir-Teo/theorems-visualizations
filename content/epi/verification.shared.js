/** Rows are exposed/unexposed; columns are cases/non-cases. Sampling fixes column totals. */
export const caseControlCells = (exposedCases, exposedControls, cases = 100, controls = 100) => [
  [exposedCases, exposedControls, exposedCases + exposedControls],
  [cases - exposedCases, controls - exposedControls, cases + controls - exposedCases - exposedControls],
  [cases, controls, cases + controls],
];
export function recoverCaseControlRisks(exposedCases, exposedControls, frequency) {
  const exposure = frequency * exposedCases + (1 - frequency) * exposedControls;
  return { exposed: exposure ? frequency * exposedCases / exposure : null,
    unexposed: exposure < 1 ? frequency * (1 - exposedCases) / (1 - exposure) : null };
}
/** One fixed per-examination risk, calibrated once at the default illustrative controls. */
export const DEFAULT_EXAMINATION_RISK = (1 - ((1 - 1989 / 20042) / (1 - .012)) ** (1 / 6)) / .4;
export function handwashingMortality(effectiveness, examinations, contaminatedShare, background, perExamination = DEFAULT_EXAMINATION_RISK) {
  return 1 - (1 - background) * (1 - contaminatedShare * (1 - effectiveness) * perExamination) ** examinations;
}
export const rareBaselineLimit = (riskRatio, relativeError = .1) => relativeError / ((1 + relativeError) * riskRatio - 1);
/** Cornfield's binary-confounder rate ratio, assuming no direct exposure effect. */
export const confoundedRiskRatio = (pExposed, pUnexposed, highRisk, lowRisk) =>
  (pExposed * highRisk + (1 - pExposed) * lowRisk) / (pUnexposed * highRisk + (1 - pUnexposed) * lowRisk);
export function caseControlOdds(exposedCases, exposedControls, cases = 100, controls = 100) {
  const numerator = exposedCases * (controls - exposedControls), denominator = (cases - exposedCases) * exposedControls;
  return denominator ? numerator / denominator : numerator ? Infinity : null;
}
