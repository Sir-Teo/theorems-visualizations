# Current curve case: saved-evidence cost inventory

The four saved main frames A0–A3 each report 125 optimized group/tile visits, 152 nonempty scratch chunks, 1,741,699 submitted indices and zero original binds, live replays or stale aborts. The pinned normal draw path performs **527 full mapping validations, visiting 12,624,285 range records per main frame**. These are source-derived operation counts, not measured time or an FPS claim.

This is a read-only audit of `/tmp/atlas-root-curve-current-state`, exact stage `148407f0` and curve source `f8eb0b366bb98ff906315469f9cc022089f73465`. No geometry was regenerated and no renderer, fixture, runtime, browser or timing job ran. Input/source SHA256 values and detailed group/tile arithmetic are in `map-curve-current-saved-cost-evidence.json`.

## Original membership versus retained submissions

The saved main group tables are identical in all four after snapshots: 86 cached groups, 24 with nonzero counts. Source `paintLines` filters zero-count groups before `union`. Their serialized null bounds therefore do not enter tile arithmetic. A0's before snapshot still contains the prior selected groups; its after snapshot is the actual newly constructed main unselected group set. A1–A3 already have that same set before drawing.

For a 4096 × 1953 mask, independently applying the original `union` bounds/margin/floor/ceil/scissor loops produces exactly 125 tiles. For each tile the original renderer submits the entire cached `group.count`, even when much of that group is outside the tile. Summing those counts gives **3,424,708 original instances per main frame**, versus 1,741,699 actual curve indices: 50.8569% retained, or 1,683,009 fewer instance submissions. The corresponding four-vertex instanced draws nominally request 13,698,832 versus 6,966,796 vertex invocations; this is not a shader execution, fragment, elapsed-time or physical-work measurement. Across A0–A3 the membership totals are 13,698,832 original instances versus 6,966,796 retained indices.

The snapshot records mask area 7,999,488 and the 8,000,000 cap, but not width/height or queried native texture/renderbuffer limits. Enumerating every integer possible maximum edge up to the source limit of 4096 gives eight area-compatible shapes. Applying each to the active scale-4 groups across all 12 saved ordinals, including the three earlier unselected views and five selected views, leaves four: 3906 × 2048, 3968 × 2016, 4032 × 1984 and 4096 × 1953. All four reproduce all observed tile counts (125 unselected/main, 13 selected) and give exactly the same **3,424,708 main original instance total**. The otherwise plausible 3072 × 2604 shape is excluded by its 119 rather than 125 earlier unselected tiles. Thus the aggregate main membership total is established without claiming a uniquely observed shape. The detailed representative tile coordinates use 4096 × 1953 and remain conditional; exact coordinates vary across the surviving shapes. No extra native query or capture occurred.

The retained 1,741,699 and 152 values are independently recomputed as each main frame's after-minus-before cumulative counters, consistent across all four. They are not independently rederived from curve geometry: full extrema, ordered style memberships and individual retained indices were not retained in this saved full-map output. The stats event window contains only the last 32 tile events, so it cannot replace a complete 125-tile retained-membership oracle.

## Mapping-validation work on the normal path

Each successful `bind` calls `descriptor` once and then `supported` once. Both call `trustedCurveMapping`. Each actual nonempty `flush` calls `live` before uploading, and the completed tile calls `live` again after the final flush. Successful source predicates reach the mapping check in each `live`; no catch/replay path runs in these main frames.

| Call site | Calls per main frame | Range-record visits |
| --- | ---: | ---: |
| `descriptor` | 125 | 2,994,375 |
| `supported` | 125 | 2,994,375 |
| `live` before each chunk | 152 | 3,641,160 |
| final `live` after each tile | 125 | 2,994,375 |
| Total | **527** | **12,624,285** |

The mapping view is 191,640 bytes: two Uint32 values per path give 23,955 paths. Every successful mapping validation loops through all 23,955 range records, comparing the stored start/count snapshot and contiguous point/segment partition. This count describes loop record visits, not a claim that each record performs one memory access or a fixed number of machine instructions. Across four main frames there are 2,108 calls and 50,497,140 record visits. The one upload-time validation is separate setup work and is not added to per-frame draw counts.

Other normal-path work remains: descriptor's group lookup, ordered-ID validation, live group's membership scan, endpoint coverage filtering, curve-box arithmetic, full original-membership counting even when a curve is culled, retained-index iteration, scratch uploads and original shader draws. The retained subset alone does not bound those CPU costs. This report authorizes no caching or safety-check removal: changes to validation frequency would require a separate correctness argument covering mapping mutation, optional ownership, release and live replay.

The initial report considered main-frame dimensions only; this followup additionally filters against every saved ordinal, as requested by root. Both evidence boundaries are retained in Git. The aggregate membership result is invariant across every remaining supported candidate shape; the mask shape itself remains unresolved.

Root independently recomputes all 12 observed tile totals for each of the four surviving shapes and the invariant 3,424,708 original main memberships. The separate audit is `/tmp/atlas-continuation/curve-current-root-cost-audit.json`. The 527 × 23,955 range-record count also agrees; no elapsed time follows.
