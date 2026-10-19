# Helium: restricted orbital error versus correlation

`qchem-3.3` attributed the entire approximately 1.5 eV error of its
optimized exponential product to electron correlation. A product with
a more flexible orbital can improve this trial energy while its spatial
probability distribution still factorizes. The error includes the orbital
restriction as well as correlation. For helium's closed-shell singlet,
the fully optimized product supplies the Hartree–Fock reference; correlation
is defined relative to that reference, not this one-parameter family.

The explanation now makes that distinction. The sampled follow-on
`qchem-4.3` states it explicitly too. Both pages also clarify the H⁻
threshold comparison: an upper bound above the H + free-electron energy
fails to establish binding and cannot prove nonbinding. The earlier
agent note for 4.3 had accepted that wording too readily; its original
note is preserved alongside the correction.

## Independent variational counter-example

In atomic units take a singlet with spatial product φ(r₁)φ(r₂), where
φ(r) = N exp(−ζr)(1 + br²), ζ = 27/16 and b = 1/50. This still has no
explicit dependence on r₁₂ and no correlation of the spatial positions.
For a normalized radial probability P(r) = 4πr²|φ(r)|²,

- T = ½∫4πr²|φ′(r)|² dr per electron;
- V = −Z∫P(r)/r dr per electron;
- J = 2∫[P(r)/r]∫₀ʳP(s) ds dr;
- E = 2(T + V) + J, with Z = 2.

All integrals are finite sums of factorial moments
∫₀∞ rᵐ exp(−ar) dr = m!/aᵐ⁺¹. Exact rational arithmetic gives

E = −216333580769822709 / 75898237347134720
  = −2.850310999719016 hartree,

below −(27/16)² = −2.84765625 hartree by 0.0026547497 hartree
(approximately 0.07224 eV). This is not a claimed Hartree–Fock minimum:
one improved product already disproves attributing the full original
error to correlation. Independent radial quadrature at 8,000 and 16,000
intervals approaches the exact value; its b=0 baseline approaches the
known exponential-product energy too.

## Validation

The energy formulas, constants and numerical models on both pages are
unchanged. Native range inputs in both themes cover He with and without
repulsion, H⁻ and Z=6. Readouts remain finite and the H⁻ branch explicitly
says it does not establish binding. Eight controlled captures and the
four default page/theme captures were inspected, including distinct
energy and radial-density panels. Static/native real-TeX checks, strict
build and sample hash checks pass. No new numerical tests were added
for these prose/readout qualifications. The previously passing full
regression suite covers the unchanged numerical algorithms.

The sample now has 264 text reviews. This correction adds the first
visual and instrumented interaction notes for 3.3; 4.3 was already
visually inspected and adds no duplicate credit. No source flag or
prerequisite shortfall is closed by this correction.
