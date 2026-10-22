# Craft and performance digital-prototype checkpoint

2026-10-22 · local previews only. Six pilots are authored: P01/P02/P03/P05 remain accepted under their bounded local AI review requirements; P07/P08 remain **in review**, occupying both unaccepted slots. No prototype is published or counted as accepted production content. The full U0–U5 goal remains active in the [execution ledger](../master-plan-execution.md).

## Delivered behavior

P07, `x-craft-0001` revision 0.1.0, provides a 6-by-6 plain-weave structural model with fixed canonical warp/weft identities, a front/back vertical-axis projection, seven schematic construction stages, crossing selection, symbolic error injection and whole-weft repair. Back view reverses column positions and exposed strips while preserving the same physical IDs. Repairs restore the whole selected strip; errors on another strip remain. The complete crossing table and all seven stages remain readable without JavaScript. The original diagrams are explicitly not photographs or evidence of physical making.

The [physical-session packet](../pilots/research/craft-physical-session.md) specifies materials for practitioner validation, actual specimen images, front/back identity, a deliberately wrong crossing, whole-strip extraction/reweaving and second-person reproduction. No physical sample, photograph, practitioner or learner session is claimed.

P08, `x-performance-0001` revision 0.1.0, provides nine authored sine-tone events over eight quarter-note beats. Short/sustained gates are 0.12/0.42 beats, with separate 60/90/120 BPM and full/first-half/second-half replay controls. Native user-started audio supports play, pause, stop, event seek and volume. Position derives from the media clock; regions are rendered as exact PCM segments. Changing version, tempo or region stops playback. Text and event-table alternatives preserve the evidence/interpretation task without claiming equivalent hearing.

WAV files retain exact events, synthesis settings, region frame bounds, record revision, renderer version/formula and pending release terms in an embedded JSON comment. Private notes, playback volume and cursor are excluded. Independent review caught the original missing export provenance; the repair was independently parsed and rechecked. The [asset proposal](../pilots/research/studio-original-assets.md) records sample-free, Codex-assisted provenance and proposed-not-granted terms. The [performance-session packet](../pilots/research/performance-session.md) prepares actual performer, media-access and learner evidence without inventing it.

## Independent review and remaining gates

The [craft](universal-pilots-ai-craft.md) and [performance](universal-pilots-ai-performance.md) reports contain initial findings and final exact-hash rechecks. Content, provenance and local-draft-rights checks passed only within their stated conceptual/source/export scope. Learning and accessibility dimensions remain unpassed. The acceptance contract additionally prevents P07 full acceptance without a future physical-evidence contract and P08 acceptance while release terms remain pending. This is a concrete prototype checkpoint, not completion of the physical or performance briefs.

The four earlier pilots retain unchanged content digests and note namespaces. Their separate [history](universal-pilots-ai-history.md), [literature](universal-pilots-ai-literature.md), [philosophy](universal-pilots-ai-philosophy.md) and [agriculture](universal-pilots-ai-agriculture.md) rechecks bind the new shared artifact. Earlier receipts remain append-only. [Engineering](universal-pilots-ai-code.md) independently checked the thirteen-file bundle and pure regressions. There are 18 current scoped dimensional receipts across six records, not 18 human or specialist observations.

| Pilot | Content digest | Artifact digest |
| --- | --- | --- |
| P01 | `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af` | `451251379199fcc10fda552dc6e27c227fc87b0b4e986a6d9ae17da84e4c37ec` |
| P02 | `f19e81195af44e606595a8d44c7ad16487e29bddbb30ed510e240c0c28416f95` | `9a7cc8ac0bc6b2cb9df513f40738baf8283c9604cc55a7698c79f1bbcf269b74` |
| P03 | `57c5cbf2d12cfce4e28395bbd2c929907572aba49c371c9000de03ee7c2c172e` | `be1f4628813b985cefebd7efcec4307c39f650150f125b15ff1ff5517650db5e` |
| P05 | `d0f0f916bbed98c6abd120f748e1a4edd05e9496bc39c6dc3b56600eccdbac6d` | `34a8ee3489077d0f5d3f31e698769cef43893855ecd03aee8bd6c4450b3f542f` |
| P07 | `dc94eecd0cfbc9e820935e68dec7bcd3fcfd16d24f9dc07018c9a8b7752ad14f` | `eb5af71f25c46901dda59b4f604cf6f290fdf94c62bd7792f0a9da71b14bbde8` |
| P08 | `40190c5a0dc101882934a6579af5e9c3eb75a2d38b65d18e728fee03d9e23aaa` | `14fcf71efb415de3c2e36c19f56ba413d09628ef5c5fefda0e9018004edb382d` |

## Verification

The focused offline suite passed 62 checks. These include all 36 crossing projections/repairs, row isolation, URL-state privacy, all six tempo/version signals, finite/peak bounds, silent gaps, exact region/full PCM equality, independent waveform samples, WAV quantization/metadata parsing and refusal of fabricated full studio acceptance. Existing source, data, storage and integration-contract regressions remain included.

The browser suite passed 21 checks using one browser. Native playback—not a mocked play method—verified media progress, duration, pause/resume, idempotent repeated Play, region end, event seek, configuration stop, volume and reset. Separate fault-injection checks cover blocked play and stale promises. Exported file contents, private notes, no-autoplay reload, no-JavaScript alternatives, keyboard operations, light/dark 320/1280 px layouts and enlarged text were checked. Pixel inspection caught cramped mobile event-table headings; a scrollable minimum-width table fixed them and the targeted layout test passed again. These are engineering observations, not an actual hearing, screen-reader or learner session.

Coverage validation remains 30 domains, 85 primary collection homes, eight cross-listings, 217 classifications, 45 source receipts and eight briefs. Of the classifications, 79 remain review-needed. The preview build produces seven reproducible pages with four accepted and two in-review records. Production loading/routes/assets and the deployment allowlist remain unchanged.

Local evidence: `/tmp/atlas-studio-offline.log`, `/tmp/atlas-studio-ui.log`, `/tmp/atlas-studio-layout.log`, `/tmp/atlas-studio-screenshots/`. The explicit package now contains 85 files, plus manually reconciled MASTER_PLAN.md. The pinned rehearsal command below writes its actual result and report path to `/tmp/atlas-studio-integration.log`; use that output for the final snapshot outcome rather than treating a planned command as a pass.

```sh
node scripts/check-exploration-integration.mjs \
  --repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --base facab15e297c645d4826935f2c011a4cf367ee88 --ui
```

## Preservation and continuation

The read-only audit at `/tmp/atlas-studio-preservation.json` found the original root's 3,222 baseline files unchanged except the previously recorded handoff pointer. Frozen Wave 6 chapter payload hashes remain `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af` in integration, expansion, redesign and preserved shipping. Expansion and redesign continued independently to observed heads `4efe60194ead8a04b9b553ee4b527672a87fcfce` and `3c2952088e77e800578675c39c049447d495d132`; these observations do not accept their new work or pin their future progress. No write or message was sent to either chat. No merge, push or deployment occurred.

Next independent work: resolve classification dispositions with scoped sources, prepare the law/care professional packets, and develop researched domain orientation and opt-in integration without adding a third unaccepted lesson. All 30 overviews, 24 total pilot-sequence lessons, three journeys, dashboard, U4 introductory breadth and U5 stewardship remain in scope. A digital prototype or passing batch is not completion of the whole master plan.

Final pinned rehearsal: **PASS**. All **5,552** accepted-base files preserved; **85** package files; **62 offline + 21 browser checks** passed. Report: `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-593bg0/report.json`. The existing port-64014 preview matches the canonical six-pilot index. This result paragraph was recorded after the rehearsal; no implementation, generated artifact or test changed afterward.
