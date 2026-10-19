/** Normalized inner product of equal-width Gaussian resource-use curves. */
export const nicheOverlap = (separation) => Math.exp(-separation * separation / 4);
export function symmetricCompetitionOutcome(alpha, kappa) {
 if (alpha === 1 && kappa === 1) return 'neutral: identical species';
 const limit=Math.min(kappa,1/kappa);
 if (alpha < limit) return 'stable coexistence';
 if (Math.abs(alpha-limit)<1e-12) return 'marginal invasion boundary';
 return kappa>1?'species 2 excludes species 1':'species 1 excludes species 2';
}
