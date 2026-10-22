# Independent AI engineering review — static reading candidate

October 22, 2026. Reviewer: separate Codex AI engineering reviewer `code_review`, independent of the authoring agent. Read-only source and offline-test inspection; only this report written. No browser, deployment, author-source changes or other-worktree access performed.

## Finding history and current status

**Resolved P2 — copied generated data was bound only by written ID roster at initial inspection.** The candidate builder checks data/index.json item IDs against the frozen accepted IDs, but copies the entire data tree without validating existing shard contents or rejecting unrelated extra generated files. Matching IDs can coexist with stale statements/references/index fields or an unexpected copied payload. Static text itself uses the frozen authored projection, but its interactive companions can receive mismatched copied generated data. The author independently identified this gap and was implementing a complete generated-file content binding at review start. Require exact expected file-set/content checks, with only explicit timestamp normalization, before copying; test stale same-ID shard and extra-file rejection.

Repair independently rechecked: `generatedDataDigest` binds the complete generated file-path/content map, rejects nonregular entries and ignores only the `generated` fields of index.json/home.json. The builder requires that digest before copying; full source inventory and catalog identities must also equal the frozen roster. Both stale same-ID fields and an extra file change the digest. Independently recomputed current data digest matches the manifest: `b567d9f7f00dc57a51e3242cd6f243a1f7f2e67b50b587fe773a783d6993f980`.

Current decision: bounded source/engineering PASS for the exact files below; no additional actionable defect established. Final author-run rehearsal logs have now been independently inspected, as recorded below. This reviewer did not execute the native suite or inspect its screenshots; no deployment evidence or human observation is inferred.

## Independent verification performed

Ran `node --test tests/static-ideas.test.mjs` on Node 22.23.3: **9/9 passed**, zero failures/skips/cancellations. Tests cover accepted content/alias mutation rejection, substantive escaped HTML and canonical route behavior, clean canonical bases, opaque saved-state bytes, narrow degree-spacing TeX normalization, refused absent/existing/source output destinations and the real 7,751-ID/76-alias source freeze, complete generated-data binding with timestamp-only normalization, and natural chapter/idea ordering. These are offline checks; this reviewer did not build/render the entire candidate or launch native tests.

Accepted commitment in the manifest is facab15e297c645d4826935f2c011a4cf367ee88. The source projection binds exact readable fields, collection citation, chapter title and direct accepted aliases. Selected records remain canonical legacy IDs; local new-format IDs are not added. Current tests independently verify the frozen projection matches current authoritative content. A freeze identifies a reviewed snapshot, not new factual/professional/rights acceptance of every explanation.

## Source inspection

Static pages contain statement, explanation, qualifications, references, dependencies and interactive/evidence links directly in HTML. Their text works without a visualization or JavaScript. Existing rich-text rendering escapes source text and server-renders KaTeX through the local vendor build. Strict TeX diagnostics reject unreadable output; the narrow spacing-atom degree rewrite is static-only and does not edit accepted content. It is not an endorsement of scientific/mathematical correctness.

Canonical base accepts a clean HTTP(S) directory URL without credentials/query/fragment. Alias pages reserve their original paths, point at the frozen canonical identity, use noindex/follow and canonical metadata, and stay out of sitemap entries. Preview builds without a base omit canonical/sitemap output and retain noindex. Static aliases preserve query/hash through JS enhancement; canonical interactive links append the raw query after the legacy fragment without URLSearchParams reserialization, retaining duplicate keys and literal question marks. No note storage or migration is performed; only existing theme preference is read/written.

Output creation rejects existing paths and source-checkout destinations, checks copied trees contain only regular files/directories, renders before exclusive mkdir, and copies only the named runtime trees/app shell. Local pilot/orientation/dashboard/planning/review directories are excluded. Production source files are not replaced. Complete candidate assembly may leave a partial new directory if later copying fails; it does not overwrite the source checkout or an existing output. No public upload occurs.

Native/audit test source independently inspected: it audits every canonical/alias HTML file, unique sitemap URLs and resolved local links, draft-directory exclusion, real no-JavaScript reading/navigation, opaque alias/return state, an edited visualization round trip, and phone/desktop themes. Its root-link resolution now correctly maps an empty URL path to index.html. The static theme button is hidden until JavaScript enhancement, avoiding an inert no-JavaScript control. No browser was launched by this reviewer; final execution/layout/screenshots and candidate preservation evidence belong to the author. The static candidate preserves existing verification uncertainty and does not convert an item lacking a flag into a reviewed/accepted claim.

## Exact files at this candidate checkpoint

| File | SHA-256 |
| --- | --- |
| scripts/static-ideas.mjs | `34cad46b4a5da97bb5e4b3bb22bce0511828fa9a7b4a76bb405b3e0d02ddfaf5` |
| scripts/build-static-ideas.mjs | `2c90ef53a66157eb716e13381271a960682ea34eae30879e613cd9ab9afeabac` |
| assets/js/reading.js | `2995fe5687b2b019b7ad15110f24c44e25b6cb7ba3639c05364bdf3bb3e98f26` |
| assets/css/reading.css | `b76a0ed7a7467f68c3ef1045deb79f9306d01327de36ba457e0d73e65ee5877c` |
| static-pages/accepted.json | `78d8cfdc3481b12bd33f5eabcd1c496b5c44a564355c72df3c2c19dbe65ceacf` |
| tests/static-ideas.test.mjs | `3b0570cbc0fb9f0db6855e3d790776b9bb02c34aef3ca2d90f3f2916edc7e903` |
| tests/static-ideas-ui.test.mjs | `9716d1352acd72c709a938e0b1604255b0ab072495f81c073f86f3e63fd944cf` |
| assets/js/viz/core.js | `a6fa1753d9d9e8b9a05a7161fffc58dfd53b27002d9d393a3266aeb96515fe73` |
| assets/vendor/katex-0.16.11/katex.min.js | `e6bfe5deebd4c7ccd272055bab63bd3ab2c73b907b6e6a22d352740a81381fd4` |

Current readable projection digest: `2b156195a22cf85186b8b40fb6c35b8966a478a0c46da155a742b498907c2685`; 7751 accepted canonical IDs and 76 frozen aliases.

## Limits

Bounded AI engineering review, not source/subject, distribution/rights, professional, human-screen-reader or learner approval. Existing legacy content may retain flags and caveats. No such evidence, new local-pilot acceptance, changed Wave progress or deployment is inferred. This decision covers the bound source checkpoint; changed source or test files require rebinding. No final full-site/native execution is claimed by this reviewer.

## Final packaging source recheck

Independently inspected the 13-addition integration manifest, checker and architecture/integration/verification documents. All manifest entries exist and are unique; no replacement is requested by this package. The checker composes the pinned evidence rehearsal first, copies only explicit allowlisted regular additions into its disposable snapshot, runs focused tests and an outside-snapshot candidate build, and compares every preexisting snapshot file afterward. Browser execution is opt-in and serial; this reviewer did not execute it. The evidence predecessor supplies the exact accepted-base/preimage checks. New reading assets do not replace source shell/router/workflows; the candidate-only shell guard now requires the actual `#/map` anchor before inserting navigation.

The documentation accurately separates preserved accepted legacy material, new static access, existing local previews, deployment and subject/human acceptance. The verification document explicitly leaves the final pinned rehearsal pending and explains the earlier audit test bug; this is consistent with evidence available at review time. Its final runtime result will need a later log-inspection addendum. Independent offline rerun after the guard: **9/9 passed**, zero failures/skips/cancellations. No new actionable packaging defect established.

Packaging checkpoint hashes (the verification document may change when final execution completes):

| File | SHA-256 |
| --- | --- |
| scripts/check-static-integration.mjs | `1b71f0f06fcba1f30cf28b9c87efcc8eb2ddbb3924261928529aa10ce53b0e83` |
| docs/integration/static-reading.json | `cbd4821ae3641667621242b9cc7e0d492118da6c6c3db7489939a712518697c5` |
| docs/architecture/static-reading.md | `0fe627119398e44f468b7b58b63cadab333512a04569901ace364ede93e96275` |
| docs/integration/static-reading.md | `4fcba8c776344feb2a7e0c9f1318114c4e4f6caf7f1320bea2e9c3c69c9066ef` |
| docs/verification/universal-static-ideas.md | `62266e0d2a5bee79651095faeec37283a269ea7c35d5b66e87885fdede10e34f` |

## Long-math phone layout source recheck

The author’s broader phone probe found a real flex-item width issue after the earlier checkpoint; its earlier successful all-link rehearsal is historical for the changed CSS. Independently inspected the current repair and added native test source, without launching a browser. Header/main/footer now have explicit 100% widths and zero minimum width under the existing border-box reset; text wraps. Inline KaTeX within prose gets its own bounded horizontal scroll box; the selector excludes display-math descendants, whose existing display scroll region remains intact. The theme button uses existing defined colors. No concrete new defect is established by source inspection.

The added native case samples five long-math/paper pages at 320px, both preferred color schemes, JavaScript disabled, fonts ready, and asserts document width while recording screenshots. This meaningfully expands the earlier single-page phone check; it does not prove all 7,751 pages have been visually inspected. The final rebuild/native rerun is pending and is not claimed here. Current CSS/native-test bindings are refreshed in the table above; no author file was changed by this reviewer.

## Final successful rehearsal — independent log inspection

Final engineering decision: **PASS within this bounded AI engineering scope; no open actionable code finding.** Earlier pending execution wording describes earlier checkpoints and is superseded by this addendum. Independently read the author-run successful `reading-report.json` and associated build/offline/native/evidence logs under `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-iyYTOO/`. This is independent inspection of recorded execution, not independent native execution.

The logs agree: 101 preceding additive checks, 13 evidence/share-state checks, 9 static-reading checks and 6 native/whole-site checks pass (129 total), with no reported skips/failures/cancellations. Strict build reports 7,751 written + 5,823 planned, 531 chapters, 85 collections, zero errors/warnings; the preceding static check reports 7,688 inspected items and zero errors/warnings. The reading build log matches every build field in the rehearsal report: 7,751 ideas, 76 aliases, 85 collection directories, 7,837 canonical URLs, 7,914 emitted files including sitemap, zero math errors and exactly two normalizations. Rendered output digest is `9888dcb34376d9c0b1b7ca49eba4fdb4ae57d54c6056f302754a7a771d6ca3a2`.

The native log records all 7,913 HTML pages audited, 121,124 local references resolving to 7,844 local targets, plus passing no-JavaScript navigation, opaque-query alias/interactive return, actual edited-control state restoration, library navigation and sampled phone/desktop/long-math overflow checks. The reading report records all 6,088 preexisting snapshot files preserved. Its preceding evidence report records 89 existing generated data files preserved except explicit timestamps and 5,981 unrelated snapshot files preserved around its two earlier reviewed production replacements. These are checker/log results; this reviewer did not independently inspect every generated HTML file, perform human reading sessions, or view final browser screenshots.

Compared current files against every reading-rehearsal change hash: all renderer/runtime/build/checker/manifest/test and architecture/integration hashes match. The author verification document changed only to record final results after the run; its current binding is refreshed above. The removed duplicate screenshot write is present in the final test source hashed by this passing run and does not change assertions. The report itself is necessarily amended after the run. Author verification claims about original/Wave heads and pixel observations remain attributed author observations; this reviewer did not access those other worktrees or independently repeat them. The final source/docs scope remains local candidate preparation, no publication and no new subject/rights/professional/human acceptance.

Exact inspected execution-record bindings:

| Record (under the rehearsal directory above) | SHA-256 |
| --- | --- |
| reading-report.json | `f81f9d128c0eb839983967c3a53ece3b73b10b1652bc51d5d3b33e315c22e6ec` |
| reading-build.log | `3c7cda7b980a57fc07dbb8ba3387fedf7df82f784084343180b1f6ef6b81df86` |
| reading-offline.log | `1658a35ddb14df388069e467a977c99d0706365e8bfadf1977a25b0894219e0a` |
| reading-native.log | `531253ce14ba0cde1f65349a987de94673f838aa218c178665b144b0da06881d` |
| evidence-report.json | `b60fea57fa4fe555281445d76edba4a8a75e0ed98c2ae3a51bfa4f47d624c8cb` |
| evidence-offline.log | `d0dde25b35457ad78921601073dd8d0701b5daca5b330c782226b67659bfa139` |
| check-5.log | `34f3b945e1eca5649fb081f47eddcea8cdc3d730916b14e765fb9a75d6ba130f` |
| evidence-static.log | `c07e324eb26f65dff0249591e823fd193fa07b34d0d1b1413a466c7a580dc543` |
| evidence-integrated-build.log | `ddfb63e376bb03a9fdfc6e8e6e8321a76478c59a97e513ed0e350f03cca15612` |
