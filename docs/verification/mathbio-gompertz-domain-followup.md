# Gompertz: qualify the sigmoid and future inflection

Independent peer review of the prerequisite candidate found that mathbio1.8’s old universal “sigmoid” sentence did not match the newly explicit allowance for either sign of y₀=log(N₀/K). This follow-up changes only that statement sentence, preserving the formula, all functions, model values, dependencies, flags and syllabus rows.

For 0<N₀<K the full solution is sigmoid and increases toward K. Its inflection at N=K/e is strictly in the future exactly when N₀<K/e. If K/e≤N₀<K, the forward trajectory is already concave (with the inflection at the initial endpoint in the equality case). N₀=K is stationary; N₀>K decreases convexly toward K.

With y=log(N/K), the exact formulas are N′=−aNy and N″=a²Ny(y+1). For y>0 these are respectively negative and positive. For y<0 the curvature changes at y=−1; solving y₀exp(−at)=−1 gives t*=log(−y₀)/a, positive exactly for N₀<K/e. Thus the domain qualifiers follow directly from the same analytic solution already used in the item.

Own one-off evidence `/tmp/atlas-worker-three/mathbio-gompertz-domain-evidence` contains the exact parent `1b5e4d6` byteguard and192 derivative/curvature profiles, including below/equal/above carrying capacity and past/future inflections. All71items and the entire syllabus are compared, allowing only this exact statement substitution. Every flag and visualization function, including unresolved1936item3.14, remains unchanged.

Focused static1/0/0, isolated strict build0/0, and both fresh320px statement/explanation renders pass for runtime, blank canvases, TeX and page bounds. Personally inspected both actual final statement images, `statement-320-{light,dark}.png`. Logs `math-byteguard.log`,`static.log`,`build.log`,`native.log` remain in own evidence; generated build output stays outside the worktree. This is a bounded mathematical prose repair, with no new original-source closure or complete input/state audit claim.
