# Thrust-network uniqueness and compressive force profiles

`arch-4.11` already asserted that its finite weighted Poisson system has
one height solution. The existing prerequisite `pde-1.5` defines the
continuum equation; it does not establish invertibility of this discrete
system. The other immediate prerequisites concern membrane statics and
funicular geometry. The written `ladr-7.62` identifies symmetric positive
definite matrices as matrices of positive invertible operators. This is
the exact additional step used by the uniqueness claim, not an optional
numerical implementation detail.

For fixed supports, extend any free-node vector by zero on the boundary.
The reduced weighted Laplacian satisfies

$$u^T L_{ff}u=\sum_{\{i,j\}}q_{ij}(u_i-u_j)^2.$$

With positive densities, a zero sum makes the vector constant on each
connected component. If each free component reaches a fixed support,
that constant is zero. The reduced matrix is therefore symmetric positive
definite and invertible. These are the explicit hypotheses now supplied
with the existing uniqueness claim. The regular grid has positive rows
and columns joining every free node to its fixed boundary, with or without
diagonals. The statement of the target definition and `tnaSolve`'s actual
matrix assembly were compared with this argument.

That comparison exposed a violation of the positivity hypothesis in the
visualization. Its force profile uses `1 + contrast*(1-u*u)` on normalized
offsets in [-1,1]. Diagonal lines instead received the physical offset
`(x∓y)/sqrt(2)`, whose range on the square exceeds 1. For the 13-node grid,
an outer diagonal with contrast 12 could have the factor -43/6. Those
negative forces contradicted the compression-only scope, invalidated the
positive-definite argument, and could produce negative drawing widths.

The helper now uses normalized diagonal offsets `(x∓y)/2`, matching the
profile and force diagram. For contrasts in [-0.9,12] the factor is at
least 0.1; all edge forces remain positive. The diagram axis now identifies
the normalized offset. No artificial clipping of negative forces is used.

Regression checks exercise both grid sizes 5 and 13, both contrast
endpoints for each family, and diagonals on/off. They check every edge's
positivity, diagonal force against independently computed integer-grid
offsets, every free-node equilibrium residual and all support heights.
A separate zero-load check recovers a prescribed affine height exactly
with and without diagonals. The ten architecture regression groups pass.
Native checks in both themes exercise all three vault shapes at the former
failure setting, actual diagonal/section controls and optimization, checking
finite readouts and positive drawing widths.

The written/syllabus edge is appended to the geology prerequisite ledger.
The baseline reciprocal peer reports retain their original scope; this
follow-up has a source/target semantic comparison and structural checks,
without a claim of new independent peer review. Architecture reaches
**25** written cross-field prerequisites; **9** collections remain below
the threshold. There are **772** integrated additions and no new source
closure or human-review credit from this prerequisite change.

Validation: strict build, architecture regressions, focused static/native
checks, full graph cycle/mirror reconciliation and current-build human
worksheet. Historical source/browser checkpoints are preserved.

Final checks also pass the full regression command, all 6,688 static
visualizations, native mode validation in both themes, and six focused
smoke routes (home, map, architecture prerequisite path, collection, chapter
and item). The preceding source commit records the complete 272-route
smoke pass; this subsequent graph/force-profile change has fresh scoped
browser evidence rather than a relabelled whole-atlas browser census.
