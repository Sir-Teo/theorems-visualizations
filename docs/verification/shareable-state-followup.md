# Shareable visualization states and embeds

2026-10-19. Implements MASTER_PLAN §8's state URLs and embedded item views.

## Behavior

Every written visualization has a **Share / embed** panel. **Create state link** captures a
snapshot and produces an item URL of the form `#/t/<id>?s=…`, copyable link text, iframe code
and an embed preview. A later change requires creating a new snapshot. `?embed=1` displays a
compact title, caption, visualization, controls, readout and link to the full explanation.
Normal site navigation, statements and dependency panels are hidden in that view. The same
state can be opened inside an actual iframe; the iframe remains interactive.

This captures actual runtime data, rather than DOM slider thumb values:

- Slider values, toggles, segmented choices and text/formula values.
- Native 2D handle coordinates, replaying their mathematical constraint and `onDrag` callback.
- Native Stage3D yaw, pitch and zoom.
- Proof-step index, with a matching frame count.
- Animation time, restored paused so a recipient can inspect the shared instant.

Changed control callbacks run first, followed by handle callbacks, explicit custom data,
camera, clock and proof step. In particular, a control callback that restarts the clock does
not erase the saved animation time. Option labels and component inventories must match the
saved visualization. Original input order in the URL cannot change replay order.

`mount(host, viz, {state, onStateError})` remains backward compatible with existing callers;
the returned cleanup function also exposes `snapshot()` and `stateInfo()`.

## Explicit scope limits

Opaque closure data cannot be inferred from controls. **Custom graph edits, freehand points,
random samples, button counters, custom-kit handles/cameras and simulation history need an
explicit `v.shareState(key, {get, set, validate?})` adapter.** The panel states this limitation
and lists included custom data in plain language; it does not claim that every custom picture is
fully captured. The new API is documented with an edited graph example in AUTHORING.md.

The native fixture registers real graph nodes and edges through an adapter and demonstrates
their reconstruction. Existing content is not bulk-migrated to adapters in this change.
Audio, hover, executable functions and external resources are excluded. Typed arrays must be
converted to plain arrays by the adapter. Arbitrary custom animation histories do not become
reproducible solely because the clock is restored.

## Validation and bounds

The codec is versioned, UTF-8/base64url encoded and tied to one item. It allows finite numbers,
booleans, text, arrays and plain objects, with at most 18,000 decoded UTF-8 bytes (24,000 token
characters), 1,000 components, depth 12 and 10,000 visited values. Prototype keys, repeated
components, invalid Unicode, unsupported versions, non-finite values, executable values,
malformed payloads and excessive sizes are rejected. Registry values are validated before
replay. A dependent setter can reject after controls have replayed (for example, changed proof
frames). Any restore failure destroys that runtime, including timers/listeners, and mounts
fresh defaults before showing its notice. The native fixture changes a saved step inventory
and checks that previously replayed controls, handle model, graph, camera and clock all reset.
Decode errors are visible in embedded views too, where the ordinary share panel is hidden.

Commands run:

```sh
node --test tests/share-state.test.mjs tests/share-state.mjs
node --test tests/ui.test.mjs
node --test tests/kits-world.test.mjs tests/kits-science.test.mjs
node scripts/check.mjs --static --quiet
node --check assets/js/viz/core.js
node --check assets/js/app.js
git diff --check
```

Four codec/registry groups and four native groups pass. The six existing UI regressions and
both existing science/world kit suites pass. The static check reports 6,621 visualizations,
zero errors and zero warnings. The final fallback hardening receives a full eight-group rerun.

Native evidence includes:

- **Real item, both themes:** keyboard-select spring mode and mass 4 kg in `mech-1.6`, drag the
  actual anchor to approximately `(1.3, −0.7)`, create a state link and reopen it. The numerical
  readout and mathematical canvas match exactly, with playback paused. The token contains the
  moved handle coordinates and exact mass value. The generated iframe loads and restores those
  controls and the numerical result, with no horizontal overflow.
- **Runtime and adapter fixture:** native scale, toggle, choice and formula input changes
  reconstruct the model variables used by the readout. A second slider retains the runtime
  value π exactly, even though its DOM thumb snaps to a step grid. A real handle restores its
  angle constraint and `onDrag` model state. An edited graph edge, proof step, dragged 3D camera
  and nonzero paused animation time all round trip exactly.
- **Invalid links:** malformed, oversized, future-version, wrong-item, changed-component,
  out-of-range slider and changed select-option links report failure while preserving usable
  controls. An invalid embedded state also shows its fallback notice.
- **Narrow view:** normal share fields and compact embeds have no horizontal page overflow at
  320 px.

Screenshots are regenerated by the native test in `/tmp`:

- `atlas-share-state-{light,dark}.png`: full restored item pages.
- `atlas-share-panel-{light,dark}.png`: open sharing controls and explicit capability limits.
- `atlas-share-embed-{light,dark}.png`: compact restored item views.
- `atlas-share-embed-mobile.png`: 320 px embed.
- `atlas-share-adapter-camera.png`: reconstructed graph, handle, model readout, step and camera.

Both embed themes, sharing panels, the restored dark item, mobile embed and adapter/camera
fixture were inspected. Controls and notices are legible, fields stay within their containers,
and the compact view retains its attribution link.

## Files

`assets/js/share-state.js`, `assets/js/viz/core.js`, `assets/js/app.js`,
`assets/css/style.css`, `AUTHORING.md`, `tests/share-state.test.mjs` and
`tests/share-state.mjs`. No content verification flags or central ledgers change here.
