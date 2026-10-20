# Vortex stretching: time dependence of the illustrated Euler flow

The scope of fluid3.3 called the illustrated flow steady even though the implemented vorticity is ω(t)=ω₀exp(εt). This follow-up changes only “steady” to “time-dependent”. It preserves every visualization function, model value, verify flag, dependency and syllabus row. It does not reopen or claim completion of an original-source audit.

The actual particle parameterization gives radial velocity −εr/2, axial velocity εz and angular velocity Ω(t)=ω(t)/2, with Ω′=εΩ. In Cartesian coordinates u=A(t)x, where

```
A = [ −ε/2  −Ω    0 ]
    [   Ω   −ε/2  0 ]
    [   0     0   ε ]
```

The trace is zero and curl u=(0,0,2Ω). For nonzero ε, its time derivative is nonzero. Nevertheless A′+A² is diagonal, with entries ε²/4−Ω², ε²/4−Ω², ε². Thus the field satisfies incompressible Euler exactly, with pressure per unit density

```
p/ρ = −½[(ε²/4−Ω²)(x²+y²)+ε²z²] + C(t).
```

The off-diagonal terms cancel precisely because Ω′=εΩ. The ε=0 control is its steady special case. The actual angular trajectory θ=ω₀(exp(εt)−1)/(2ε), with the continuous zero-strain limit, differentiates to Ω(t); volume and circulation retain their existing invariants.

An independent one-off check uses twice-scaled integer matrices to verify861exact Euler residual identities without floating-point cancellation and366actual-parameter trajectory/pressure/circulation/volume cases. A separate byte comparison with parent `6813dad` checks all53fluid items and the entire syllabus, permitting only this scope-word substitution. Script and log: `/tmp/atlas-worker-three/fluid-vortex-scope-evidence/verify.mjs`, `math-byteguard.log`.

The isolated strict build remains6684written/6890planned/450chapters/85collections,0errors/0warnings. Both fresh320px checks use the built production route `#/t/fluid-3.3`, since the generic visualization harness does not render scope. The actual corrected scope, mounted visualization, runtime, TeX and page bounds pass in both themes. Personally inspected both own scope screenshots and the full light production page; own screenshots/logs are under `/tmp/atlas-worker-three/fluid-vortex-scope-evidence`. No generated output is committed.
