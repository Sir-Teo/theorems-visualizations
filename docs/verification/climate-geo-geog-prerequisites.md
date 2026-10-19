# Derivational cross-field prerequisite audit

Reviewed2026-10-18 while verifying the climate, rotating-fluid and projection equations. This is not a claim that the master plan's25-edge gate is met everywhere. Added dependencies only where the displayed derivation or numerical computation actually uses the target idea; matching source/syllabus entries were updated. Source evidence is in `climate-ch04.md`, `climate-remaining.md`, `climate-geo.md`, and `geog-projections.md`.

| Source | Added prerequisite | Actual use |
|---|---|---|
|climate-2.14|thermo-9.6; thermo-7.5|Pane emission εσT⁴ and linear temperature-difference convective exchange in the inspected Fourier-inspired modern model|
|climate-3.9|prob-1.6.9; stat-10.1; stat-12.16|Density change of variables λ→F/λ, likelihood/prior normalization, and the covariance-weighted normal combination actually computed by the toy|
|climate-3.10|prob-2.2.1|Independent photon reflection indicators give the binomial Monte Carlo variance/standard error|
|climate-4.1|pma-3.26|The displayed feedback rounds are a geometric series; its convergence condition matters|
|climate-4.3|thermo-1.16|The explicit dry Poisson profile is the adiabatic ideal-gas relation|
|climate-4.7|pde-1.4|The displayed latitude operator is diffusion of temperature with local forcing/restoring terms|
|climate-4.8|pma-9.16|Kernels are coordinate partial derivatives, evaluated holding the other column variables fixed|
|geo-3.9|thermo-2.7|Carnot efficiency is the starting heat-engine factor; recycling dissipation changes it to ε/(1−ε)|
|geo-4.5|ode-1.4|The linear pumping balance gives an exponential solution of the first-order spin-down equation|
|geo-4.7|ode-3.6|The constant-coefficient coupled linear system has complex modes that rotate and decay, producing the Ekman spiral|
|geog-5.3|ladr-6.55|Orthographic mapping is an orthogonal projection onto the viewing plane|
|geog-6.1|pma-10.9|The equal-area derivation applies the change-of-variables Jacobian to spherical/planar bands|
|geog-6.2|num-2.4|The auxiliary angle is found by Newton iteration; the old mech-8.9 edge was an analogy to Kepler's equation, so it was replaced|
|geog-6.3|num-5.2|The Robinson reconstruction actually interpolates its source table by a natural cubic spline|
|geog-6.5|graph-1.5.2|The unfolded20-face net retains a19-edge spanning tree, leaving11 of30 edges cut|

Counts from the current registry before these edits were climate19 written/37 full-syllabus, geo15/31, geog16/19 and astro0/0. These are dependency **edges** crossing a field boundary, not merely crossing collections; physics-to-physics links do not count. The additions give climate29/47, geo18/34 and geog20/23. Thus climate passes25 written edges; geo and geog remain below25 written edges, and geog remains below25 even over the full syllabus. Astro was subsequently audited in astro-stellar.md and astro-planetary.md: four stellar method edges and seven planetary method edges were added, including two to the planned RK4 algorithm. The current registry has9 written-target astro cross-field edges and11 with planned targets; it remains below25. These deficits remain visible rather than being filled with topical links. Final registry counts are recomputed during integration, since other reviewers share this checkout.

`node scripts/check.mjs climate geo geog --static`:133 items,0 errors,0 warnings after these additions. This validates target IDs and graph consistency, in addition to the source-specific justification above.

Count terminology clarification (2026-10-18): the earlier abbreviated “written” totals meant edges with a **written source** and either a written or planned target. Fresh counts written→written / written→all / all→all were climate12/29/47, geo13/18/34, geog12/20/23, astro9/11/11. The master plan’s written-source gate therefore passes climate; geo, geog and astro remain below25. These are genuine dependency shortfalls, and no edges were added merely to fill the count.


The bio follow-up audited the actual methods in the reviewed equations. Added neuro-2.9→stoch-10.2 (finite-state continuous-time channel transition semigroup), neuro-4.6→nla-4.1 (the implemented tree Gaussian elimination), popgen-3.9→stoch-9.3 (the stated Poisson event process), popgen-4.12→prob-2.4.1 (the strong-law step in its proof), and popgen-4.14→num-1.5 (the actual cancellation-safe quadratic equilibrium). Matching syllabus entries were synchronized. These are directly used methods, not topical additions.

Fresh written→written / written→all / all→all cross-field counts after the bio work are neuro 6/11/23, sysbio 2/2/6 and popgen 11/13/22. Thus all three remain below the 25-edge master gate even when every syllabus item is included. The previous climate/geo/geog/astro counts remain 12/29/47, 13/18/34, 12/20/23 and 9/11/11. Only climate meets the written-source 25-edge gate among these owned collections. These honest deficits remain open for integration.
