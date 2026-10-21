# Symplectic Euler: area preservation and finite-step energy error

This separate follow-up changes only the concluding sentences of mathbio3.4’s idea. The old text said a symplectic integrator preserves the conserved quantity exactly. The illustrated finite-step symplectic Euler method preserves canonical area and generally has nonzero energy error. The revised explanation distinguishes it from the energy-preserving exact flow and points to the existing V−V₀ plot. No numerical method, control, picture, parameter, dependency, source flag or syllabus row changes.

For the widget’s β=δ=1, put u=log x and w=log y. Its Hamiltonian is V=exp(u)−γu+exp(w)−αw, and the exact equations are u′=−V_w, w′=V_u, so dV/dt=0. The actual symplectic Euler update is

```
W = w + h(exp(u) − γ)
U = u + h(α − exp(W)).
```

Set a=h exp(u), b=h exp(W). Its Jacobian in(u,w) is

```
[ 1−ab  −b ]
[   a    1 ],    determinant = 1.
```

This is the composition of two canonical shears. Its inverse follows by undoing the U update and then the W update. Area preservation does not imply V(U,W)=V(u,w).

At the actual defaults α=γ=1, x=1.8, y=1, h=.08, independent85-digit Decimal calculation gives

```
V(U,W)−V(u,w)
 = −0.002112398183985305202665457203605053629715697404029221284152882577078509891450167556.
```

The actual browser’s first painted orbit point is(1.790507811153589,1.0660923987615052), and its first painted energy point is(.08,−0.0021123981839856754), agreeing within floating-point rounding. This directly refutes the old exact-preservation sentence while leaving the numerical comparison intact.

Own evidence `/tmp/atlas-worker-three/mathbio-symplectic-evidence` contains `reference.py`,`reference.json`,`verify.mjs`,`math-byteguard.log`,`native.mjs`,`native.log`. The independent check covers432canonical determinant/inverse cases and the high-precision default counterexample. An immutable parent `47c466a` comparison checks all71biology items and the entire syllabus, allowing only this exact idea substitution. Every function, flag and all other properties remain unchanged, including1936item3.14; this is not a source-body closure.

Focused static1/0/0 and isolated strict build6684written/6890planned/450chapters/85collections,0errors/0warnings pass. Generated output remains under the existing own scratch build, with separate follow-up logs. Both fresh320px native checks select symplectic Euler through the real control, compare actual numeric DOM directly with all three registered values(1,1,.08), and compare both actual painted first-step paths with the independent reference. Changed explanation, runtime, TeX, blank and page-bound checks pass in both themes. Personally inspected both own final idea screenshots and both actual energy plots, `idea-320-{light,dark}.png` and `energy-320-{light,dark}.png`. This bounded prose/counterexample verification does not claim a new complete parameter/state audit of the unchanged integrators.

Independent review of the first follow-up found that its idea-only check had missed the contradictory caption and matching syllabus picture row: both still promised exact contour/flat-energy preservation for symplectic Euler. This separate prose correction fixes those two fields. The caption also identifies the control named “exact (tiny RK4)” as the actual numerical reference using fixed h=.002, with the slider affecting the other methods. It removes universal nonzero-drift claims; equilibrium can have zero numerical error. The mathematical exact-flow theorem and the corrected area-versus-energy explanation remain unchanged, as do every function, control, flag and all other item/syllabus properties.

Own correction evidence `/tmp/atlas-worker-three/mathbio-energy-caption-evidence` includes an exact parent9474231 byte guard over all71 item objects and the entire syllabus (only3.4 caption and its corresponding picture row differ), static1/0/0, and a fresh isolated strict build0/0. Both fresh320px themes reproduce the actual default symplectic first-step energy counterexample above, directly compare all numeric DOM values with registered values, and inspect the new caption/idea for runtime, TeX and page bounds. A separate actual browser check of all four real method selectors at x=y=α=γ=1 obtains exactly unchanged orbit points and exactly zero plotted energy error, confirming that drift is not universal. Personally inspected both own final caption images and the own symplectic energy plots; no overflow or clipped prose. `native.log` records all eight method/theme equilibrium checks and both default drift comparisons. This is a bounded explanation correction, not a new guarantee about the unchanged method readout shorthand over every parameter or a complete integrator state audit.
