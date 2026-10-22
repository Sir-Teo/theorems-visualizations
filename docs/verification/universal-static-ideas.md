# Static reading verification

October 22, 2026. Candidate-site engineering check only. The [contract](../architecture/static-reading.md) and [integration procedure](../integration/static-reading.md) preserve accepted content and exclude local new-format previews. Exact independent AI scope is in [the code review](universal-static-ideas-ai-code.md).

## Current results

Final pinned integration rehearsal: **PASS** on Node 22.23.3 against accepted base `facab15e297c645d4826935f2c011a4cf367ee88`. The exact report is `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-iyYTOO/reading-report.json`; the complete local candidate is its sibling `static-site/`. Temporary artifacts are local evidence; this committed record retains their results if the temporary directory expires.

| Check | Final evidence |
| --- | --- |
| Composed pilot/evidence preflight | 101 additive tests + 13 evidence/share-state tests pass; strict production builds and 7,688-item static check clean |
| Static reading unit checks | 9/9 pass: exact roster/content, exclusion, canonical safety, state preservation, math repair, output safety, real freeze, full data binding and natural ordering |
| Native/whole-site checks | 6/6 pass; no skips/cancellations/failures |
| Total scoped tests | 129 (101 + 13 + 9 + 6); not a rerun of the historical full numerical suite |
| Static inventory | 7,751 written idea pages + 85 collection directories + library = 7,837 canonical URLs; 76 identity-preserving alias pages |
| Generated link audit | All 7,913 HTML pages read; 121,124 local link/asset references resolve to 7,844 distinct existing local files; sitemap has exactly 7,837 unique canonical URLs and excludes aliases/drafts |
| Math rendering | Every generated page checked for fallback/error markup; zero errors, with exactly two documented degree-spacing normalizations |
| Source/data freeze | Content projection `2b156195a22cf85186b8b40fb6c35b8966a478a0c46da155a742b498907c2685`; generated data `b567d9f7f00dc57a51e3242cd6f243a1f7f2e67b50b587fe773a783d6993f980` |
| Generated output binding | `9888dcb34376d9c0b1b7ca49eba4fdb4ae57d54c6056f302754a7a771d6ca3a2`; exact renderer/runtime hashes in `static-build.json` |
| Snapshot preservation | All 6,088 preexisting snapshot files byte-identical after the reading package; preceding evidence delta separately preserves all 89 legacy data files except generation timestamps |

Native checks exercise no-JavaScript explanation/MathML and collection/prerequisite navigation, project-prefix serving, aliases with opaque queries/fragments, embed return, and an actual edited visualization control shared through the reading page and restored. The copied root shell's Read link opens the real library. No local exploration, lab, orientation, authoring manifest or review document is in the assembled site.

Responsive checks include four PMA captures (320/1280 px, light/dark) and ten no-JavaScript 320 px cases across `mathbio-7.15`, `energy-1.5`, `imaging-3.7`, `game-3.11` and `astro-10.20`. All viewport-overflow assertions pass. The four PMA images and two critical images (mathbio light, imaging dark) were visually inspected; four of those inspections were matched byte-for-byte to final captures. This does not claim pixel inspection of all 7,751 pages or all ten critical images. Long formulas remain complete in local horizontal scroll regions. All test browser contexts and servers closed normally.

## Findings repaired and retained scope

- Initial strict rendering found two preexisting degree-spacing expressions unsupported by bundled KaTeX. The static-only empty-base normalization fixes them without editing authored content or the interactive runtime; focused tests and the full render pass.
- Initial native link-audit failure was a test resolver error: a root URL mapped to an empty filename instead of `index.html`. The corrected root resolution is exercised by the full passing audit; the earlier run is not reported as a pass.
- Independent review identified that matching catalog IDs alone would allow stale copied data. All generated file contents are now bound (only index/home generation timestamps excluded), and the source inventory must match the frozen roster. Stale-field/extra-file tests and independent recheck pass.
- The extra long-content phone probe found actual horizontal page overflow at mathbio-7.15. Width/min-width constraints and local inline/display math scrolling repair it; all ten final critical cases pass. The failure is retained in `/tmp/atlas-static-reading-20261022-critical.log` and `...-critical-diagnostic.log`.

## Original and Wave preservation

`/tmp/atlas-static-reading-20261022-preservation.json` records all 3,222 original-checkout baseline files. Only the earlier authorized handoff pointer differs; this turn wrote no original-checkout file. Content, application/build source, six local exploration records/renderings, orientations, dashboard/pinned inputs and frozen wave assignments are unchanged in the integration checkout.

Observed read-only heads: expansion `e86e45ea9a78b06197b269664e6f50a343609c2e`, redesign `ee11c6197385e6906fcd1d9c71dce1335dcdb2d7`, shipping `f0a324f98f5f7f2538f7685b84d1041764a65828`. All three chapter-assignment digests remain `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af`. Expansion's current handoff still identifies facab15e as the accepted export; its newer draft HEAD is not promoted by this task.

Result/roadmap documentation is updated after the successful run; source/manifest/test hashes remain checked against that run before committing. The separate AI report distinguishes its actual offline/source/log checks from author-run native/pixel observations.

## Limits and preservation

No new source research, rights clearance, real screen-reader/learner observation or public release is established by these checks. Existing verification flags and source qualifications stay visible. Source/HTML parity is broader than sampled browser observations; final results must keep those scopes distinct. The complete output excludes labs/explorations/orientation/docs and draft identities from its static inventory and sitemap.

No original or active Wave checkout is written. The four accepted local pilots and two studio drafts retain their artifacts, review status and notes. Publishing static legacy routes, integrating public new-format records and closing professional/physical gates remain roadmap work.
