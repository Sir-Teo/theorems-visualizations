# Saved states for stepped jury and ultimatum controls

Resolved after a concrete native replay reproducer showed a model/thumb mismatch. The shared runtime intentionally preserves exact programmatic values separately from a range input’s step grid. These three widgets promise stepped controls, so their replay must enforce those steps.

The original reproducer is `/tmp/atlas-offgrid-accepted-replay.mjs` and `.log`. In jury 5.4, saved competence 0.55235 restored model 0.55235 but thumb 0.55; jury 5.5 similarly restored competence 0.70235/thumb 0.7 and following 0.40555/thumb 0.41. Ultimatum inequity 0.37 restored model 0.37/thumb 0.25. The latter output also rounded quarter ticks to only one decimal place.

The isolated jury helper now checks the exact finite decimal fraction against the declared 1/200 competence or 1/100 following grid. The isolated ultimatum callback requires one of the 17 quarter steps and displays two decimals. These callbacks participate in the existing runtime replay rejection: an unsupported saved value produces the saved-state notice and a complete default remount. The mathematical probability/utility helpers retain their full continuous domains; the analytic critical selector remains a separate exact case. Shared runtime, default values, offered ticks and all other items remain unchanged.

Validation after the repair:

- All 10 existing independent jury/game mathematical groups pass, including every legal competence/following/quarter tick and explicit off-grid rejection. `/tmp/atlas-stepped-replay-math.log`.
- Twelve jury native viewport/theme groups reject even sizes and off-grid competence/following states, verify complete default input/model/output/selector consistency, then restore a valid snapshot. `/tmp/atlas-stepped-replay-jury.log`.
- Six ultimatum native groups reject three off-grid inequity values, verify default controls/selectors, exercise all 17 valid quarter ticks with exact numeric outputs, and restore a valid inequity snapshot. `/tmp/atlas-stepped-replay-game.log`.
- The 18 targeted groups cover 1450/430/320px and light/dark. Scoped static: 3 items, 0 errors or warnings; `/tmp/atlas-stepped-replay-static.log`.

This follow-up preserves the earlier complete source and mathematical reviews. It adds targeted replay evidence; it does not claim that a new complete browser-control matrix or full 1,582-test checkpoint ran on the revised code. Source queue counts are unchanged. See the [jury source review](polsci-jury-followup.md), [game source review](game-centipede-ultimatum-followup.md) and [prior full checkpoint](checkpoint-55c657d.md).
