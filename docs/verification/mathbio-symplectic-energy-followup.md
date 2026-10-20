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
