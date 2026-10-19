# Polygonal reachability and a finite path budget

The proof in `top-3.12` correctly uses all points reachable by any finite
polygonal path in U. Its visualization instead shows a fixed length budget
L, yet called that green set open and said every ball around a reached
point belonged to it. Even in U=R, the set reached from 0 with length at
most L is [-L,L], whose endpoints have no such neighbourhood. The default
C-corridor capture visibly put the gold disc across the green frontier.

The caption and readout now separate the finite-budget front from the
union over all finite budgets used in the proof. A ball in U permits
adding a segment to a path, potentially increasing its length. A full
grid component is identified as a finite numerical observation, rather
than a proof that a continuous component has been found. The scope
identifies eight-neighbour grid lengths and approximate cell coverage.

The gold disc previously used 48 angular tests and a radial search, which
was not an exact containment certificate and did not check the green
budget set at all. It now has radius 80 percent of the analytic distance
to the complement of the selected region: inner/outer annulus boundaries,
the selected blob's circle, and the C-corridor's removed half-strip. The
C predicate also excludes the cut boundary itself, making that region
open as described. The grid-distance/flood algorithm is unchanged.

## Validation

- Two focused test groups cover holes, cut boundaries and the disconnected
  gap, plus gold-ball membership across a spatial grid with 120 directions
  at each interior point. The geometric membership oracle uses separate
  squared-coordinate region inequalities.
- Native light/dark mode checks pass. Eighteen controlled captures cover
  all three regions at budgets 0, 4, 14; all were visually inspected. Zero
  budget leaves the component blue, partial fronts can cross gold balls,
  and large budgets fill one component. Two blobs remain separate.
- Four real basepoint drags (two per theme) move into the excluded gap,
  producing the explicit invalid-position message, then into the other
  blob, switching the reached component. Runtime/TeX checks pass.
- Full `npm test` passes after the functional geometry change. Strict
  build, review packets and all 339 current text-review hashes are checked.
  Artifacts: `/tmp/agent-review/top-path-browser.{mjs,json}`, named PNGs,
  and `top-path-regressions.log`.

The same batch records 24 further light/dark visual findings from sample
positions 157–180. An initial duplicated billiards PNG was replaced by an
inspected isolated recapture and documented in the anomaly report. These
are agent reviews; they do not grant human or subjective listening credit.
