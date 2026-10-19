# Supplemental conditional-control verification

The base `check.mjs --modes` pass exercises individual controls visible in the default configuration and restores each parent. It does not claim to enumerate choices that appear only inside another mode. This supplement makes those branches explicit without changing the base checker or visualization runtime.

`conditional-control-inventory.json` contains 106 written candidates: 102 direct `v.select`/`v.toggle` visibility cases and four additional array/object-built groups (CPLX 2.6, EM 1.1, LADR 6.61, PL 1.3). The initial scan's 760 visibility assignments were filtered: stage, canvas, overlay, graph-node and handle visibility alone do not qualify. Candidate presence does not itself establish a coverage gap; some conditional controls are visible by default. Each entry records the source evidence, trigger types and what existing focused scripts actually establish. ALG 3.30 already has explicit native coverage for all five integer subsets; that fact is preserved.

The supplemental runner uses the actual harness and pinned local KaTeX, fresh browser contexts in both themes, and font/frame/CSS-transition readiness. It first exercises alternatives of each default-visible segmented control or toggle. After a choice, it recursively visits only controls that became visible or changed their option signature. It restores selections before visiting the next sibling. It does not take Cartesian products of unrelated siblings. Conditional branch states receive separate screenshots outside the base `shots/` names; root and restoration counts are reported separately from new conditional states.

Two bounded extra parent triggers are explicit: the ARCH 3.3 stone-count range endpoint exposes the keystone toggle, and entering `abs(x)` in LOGIC 5.13 exposes the infinitesimal-sign selector. Source conditions driven by ranges, text, ordinary buttons or pointers are recorded in the inventory. This runner does not imply general coverage of all such inputs. Any initially hidden control that never becomes visible remains in `unresolvedControls`; zero discovered states cannot certify that control.

Per-item evidence includes the collection's before/after content hash, literal external-content import closure from `externalContentHashes`, and runtime hash. A changed input invalidates that result. Every inspected state checks runtime/page/TeX errors and the existing visible-canvas blank predicate. Console errors use the base checker’s favicon/resource-load filter; all raw console messages remain in each state. A failed or unresolved item is retained in the report. Checkpoints include the active item; `complete: true` means all selected item/theme pairs were processed, while `ok` also requires every result to pass. Screenshots are not marked manually inspected by automated execution.

Commands (one browser worker per process):

```sh
node tests/verification-conditional-modes-browser.mjs alg-3.30 cplx-2.6 arch-3.3 logic-5.13 --report=/tmp/atlas-conditional-smoke.json
node tests/verification-conditional-modes-browser.mjs --theme=light --report=/tmp/atlas-conditional-light.json
node tests/verification-conditional-modes-browser.mjs --theme=dark --report=/tmp/atlas-conditional-dark.json
```

Full launches use the coordinator’s assigned worker slots so total concurrent browser workers stay within the agreed limit. The completed full-run evidence below is separate from the implementation and smoke evidence.

`--resume=/path/to/report.json` reuses only passed rows with matching theme, inventory hash and runner hash, identical before/after/current content, external-import and runtime hashes, and every required default/conditional PNG still present. Failed, unresolved, changed or missing-evidence rows are retried; complete and ok are recomputed over the selected inventory.

## Smoke verification

The bounded ALG 3.30, CPLX 2.6, ARCH 3.3 and LOGIC 5.13 smoke completed in both themes with one browser worker: eight item/theme pairs passed, covering 20 root/default states, 36 new conditional states and 48 restoration states. All initially hidden controls were reached, including the two explicit range/text triggers. There were no page, visualization, checked-console, TeX or visible-canvas blank failures; per-item content, external-import and runtime inputs remained stable.

All 36 new conditional states were visually inspected in six contact sheets, including each of the eight individual cube-clause toggles per theme. Mathematical content, revealed options and both-theme contrast were visible; no new defect was observed. Evidence: `/tmp/atlas-conditional-smoke.json`, `/tmp/atlas-conditional-smoke-contact/contact-{0..5}.jpg`. A matching `--resume` run reused all eight passing rows and recomputed `complete: true`, `ok: true`: `/tmp/atlas-conditional-smoke-resume.json`.

The frozen inventory SHA-256 is `0a96e4bb5714569b37431a8ca605dccb8c5ba8265da69bdc1db7b144eb9a12fa`; frozen runner SHA-256 is `41a8da2d35621f341c10610dfe29b8d3cc921cedf4ddc2cd1de5fcd5faca1e7d` (the report hashes include the relative filename as well as bytes, consistently with the base checker). The full 106-item runs and their visual review below remain separate from this successful smoke evidence.


## Full bounded capture after source-local corrections

Both final conditional reports completed successfully after guarded resume. Each contains all 106 inventory IDs, with every item marked passed and zero unresolved controls. Counts below are taken from the completed reports, including verified resumed rows:

| Theme | Items | Root/default states | New conditional states | Restoration states | Unresolved controls |
| --- | ---: | ---: | ---: | ---: | ---: |
| light | 106 | 411 | 263 | 568 | 0 |
| dark | 106 | 411 | 263 | 568 | 0 |

- `light`: `/tmp/atlas-conditional-light.json`, `complete: true`, `ok: true`, finished 2026-10-19T02:50:50.209Z; 552 stored PNG references.
- `dark`: `/tmp/atlas-conditional-dark.json`, `complete: true`, `ok: true`, finished 2026-10-19T02:50:51.886Z; 552 stored PNG references.

The supplemental browser used viewport **1150×1600**, device pixel ratio **1**, and harness width **1080 CSS pixels**, with one worker per theme process and fresh per-item contexts. The base full-mode capture used width **860 CSS pixels** and device pixel ratio **2**. These captures verify their stated configurations; the supplemental run does not establish equivalent layout at every width or pixel ratio. Both use the actual pinned local KaTeX 0.16.11 renderer.

Every recorded state passed the runner’s runtime/page/TeX and visible-canvas checks. Before/after collection, external-import and runtime hashes match in every final row; resume accepted only unchanged passing rows with the required PNGs present. The current-input census is maintained separately in `scripts/verification-conditional-evidence.mjs`; this note does not replace that gate.

Four AI reviewers inspected the initial **1,104 PNG references**, with image identity, control paths and findings recorded in `conditional-visual-circuits.json`, `conditional-visual-energy.json`, `conditional-visual-geology.json` and `conditional-visual-macro.json`. Initial captures and their manifest remain in `conditional-modes-{light,dark}-initial.json` and `conditional-initial-capture-manifest.json`. That initial review exposed source-local defects, including the SIG 2.5 recovered-input decimation issue; their focused correction evidence is recorded separately.

The final image census, `scripts/verification-conditional-visual-evidence.mjs` with report `/tmp/atlas-conditional-visual-evidence.json`, separately validates inspection credit against **exact current PNG bytes**, using recorded original or focused-correction image hashes. An unchanged image may retain image-inspection credit across a source-hash change; that does not transfer source, mathematical, computational or semantic verification, certify a defect correction, or give human-review credit. This documentation preserves the distinction between the initial review and the current-image census instead of describing every refreshed image as newly reviewed.

Coverage is bounded to the enumerated individual default-visible alternatives, newly revealed/signature-changed child controls, their restorations, and the two explicit range/text triggers. It excludes Cartesian products of independent sibling choices and general exploration of arbitrary ranges, text, pointers or continuous inputs. These AI native checks and image inspections do not count as the master plan’s human review sample.
