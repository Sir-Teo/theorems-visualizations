// Half of the geometric construction in RCA 6.9 keeps w<1 even for μ=0.
export const measureWeightTerm = (n, measureOfSet) => 2 ** (-n - 1) / (1 + measureOfSet);
