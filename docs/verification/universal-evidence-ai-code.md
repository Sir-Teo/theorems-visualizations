# Independent AI engineering review — legacy evidence integration

October 22, 2026. Reviewer: separate Codex AI engineering reviewer `code_review`, independent of the implementation author. Scope: evidence model/view/CSS, app routing/disclosure integration, sidecar production build, local static-ESM implementation binding and focused tests. No browser, blocked source-body retrieval, other worktree access or authored-code edit performed. Only this requested review report was written.

## Findings and decision

Three initially reported P2 defects are repaired and independently rechecked:

1. **Exact target omitted authored implementation/title.** Target snapshots now include title and an implementation digest of the authored module plus recursively parsed local static ESM dependencies. The parser never links/evaluates those modules; helper edits invalidate target bindings, and unsupported dynamic/nonlocal imports fail closed. Build emits matching implementation provenance only for published/withdrawn target shards. Shared runtime/assets and build files are included in artifact code hashes. This resolves stale reviews surviving a changed target explanation/viz module.
2. **Valid builder payload could exceed browser fetch ceiling.** The same 500,000-character constant now bounds individual exported payloads, the catalog and browser response parsing. The reproduced valid 726,446-character public fixture is rejected before export. No silent permanently-unavailable published record is produced by that case.
3. **Unrelated existing Markdown could satisfy review receipt.** Public exports now require every referenced report to name target ID, revision, reviewer ID, dimension and exact content/artifact digests. The missing-file and wrong-existing-report regressions pass. This supports exact file linkage; it cannot authenticate a reviewer or their competence.

4. **Opaque query suffix truncated through legacy alias routing.** Initially reported that raw.split('?') lost everything following a second literal question mark during the alias redirect. Repaired by splitting at only the first question mark; the native alias-return fixture now includes `unknown=a?b`, an empty value and duplicate parameters. Independently inspected the actual router lines and verified the complete suffix survives the split. The original edge is resolved.

**Final bounded AI engineering decision: PASS for the current scoped hashes below.** All four reported defects are resolved; no additional actionable engineering finding remains. This is not source, rights, professional or human-session approval.

## Independently performed verification

Ran `node --test tests/evidence.test.mjs` on Node 22.23.3 after the durable-report repair: **9/9 passed**, zero failures/skips/cancellations. These checks cover opaque routes, title/legacy flag semantics, empty/local-only nonexport, latest exact current reviews, report existence/binding, parsed transitive helpers without evaluation, malformed/unknown/private fields and unsafe paths, minimal withdrawal, matching size ceilings, and browser-loader absence/unavailable/stale/tampered/valid distinctions. The reported native browser/pixel checks belong to the author; this reviewer read their source but did not run them or claim their observations.

## Boundary inspection

Additional evidence is lazy: home/unopened explanations do not import the evidence view or fetch its catalog. Opening the disclosure preserves the mounted visualization; route/disclosure asynchronous work checks view identity before DOM replacement. Direct evidence route resolves written canonical targets/aliases, loads their existing detail shard and offers a return link. Missing planned/unknown targets do not acquire fabricated reviews.

Render uses DOM textContent for authored claims/source/review/withdrawal strings; source links permit only credential-free HTTPS. Record allowlists reject unknown/private payload fields. Local-only records are validated but not exported or listed; withdrawal emits only identity/revision/reason/date, omitting previous sources/claims. Server build checks exact latest required dimension receipts against current content/artifact, and browser loader checks catalog file hash and current target/content/review bindings. No additional evidence mutates prerequisite/dependency graph, lesson count, verification flag or visualization state.

Existing collection citations remain reading routes, not item-level read/review receipts. Legacy verify flags retain uncertainty, and absent flags do not become passes. Source access requires a bounded actual-read type/date, not discovery metadata. These are structural gates; no algorithm establishes that a person actually read a source, holds qualifications or observed learning/accessibility.

The real evidence manifest is **empty**. No source review, independent acceptance or public evidence record has been manufactured for any existing item. Synthetic fixture receipts are isolated tests and are not registered in the real catalog. The static local ESM graph contract is conservative and is not an assurance about arbitrary future runtime IO, fetched datasets or external resources; any expanded loading contract needs explicit evidence binding.

## Current exact scoped file hashes

| File | SHA-256 |
| --- | --- |
| assets/js/evidence-model.js | `fb25b55cab402f51835d105ee5ac8de58141e0d24422a9a381b0b8c9bc368ddd` |
| assets/js/evidence-view.js | `924d51900e4dd15314a1a25b853a0aa3e6031eb8552407636304649625a6ee12` |
| assets/css/evidence.css | `7c25b1c8cd1aed6a47dba958310f967a23fa813c8b0c9bc9ef4343c3e8628ea4` |
| assets/js/app.js | `17aa366ae5b0cb54fd4b185ce33f7df649eb64440a0bbe09af12a04e0d531740` |
| scripts/build.mjs | `a834475df4c8c8637c6e58d7d08cc5b0e8cdbacfd0148f5e0922a078de621020` |
| scripts/evidence-sidecars.mjs | `00d8bb96a118294ffa9a6fcd956b1e39102eb940dfde17cd26c01ebd435ebb08` |
| scripts/evidence-module-digest.mjs | `145b6dc1b90a4d8e3046f05678a8e52a317bc561a09c6e8fd4e21d6be85b86c3` |
| evidence/manifest.json | `4cabef5f65613b349279278648abe73d90dc9233983c399d20cf2a5ffae1f31a` |
| tests/evidence-fixture.mjs | `8972060b0d3865f8eac7ebf5a021bcc59c27356cf17ace0b668f313b315e72ce` |
| tests/evidence.test.mjs | `2f7e7fbb3dcc9e0588fd5f9874a255320c1a0c4cbfe69322b6b591fa0b7d1c49` |
| tests/evidence-ui.test.mjs | `ec012453c50d59bc71955a0e02e74382921adea1aecc371d880fe72a01160be9` |

## Narrow alias repair and rehearsal-checker recheck

After the final alias repair, independently reran all nine evidence unit tests: **9/9 pass**, zero failures/skips/cancellations. The actual router uses indexOf plus slice to split once, retaining the complete opaque suffix including a second literal question mark, empty values and repeated keys. The updated native test exercises that suffix through alias return; this reviewer inspected its code without launching a browser.

Read the new evidence rehearsal checker. It first obtains the existing additive universal snapshot, then requires the explicit accepted commit and exactly two pinned preimage replacements (app.js/build.mjs). Additions are path-allowlisted and differing existing destination bytes are refused. Both production builds occur only in the disposable snapshot. Existing generated data files must remain hash-identical except for declared generated timestamps removed from index/home equality; newly generated data is restricted to the evidence catalog/sidecar paths. Static/evidence/share-state checks run before the final preexisting-file preservation comparison; only the two declared replacements may differ. Native tests, when requested, use test-concurrency=1 and a snapshot-only node_modules link. No active destination/Wave checkout is written by these operations.

No actionable checker design defect found in this source inspection. Its explicit integration manifest/docs were still being prepared and the full rehearsal was not executed by this reviewer; this is an engineering code assessment, not fabricated execution or final packaging evidence. Real registry remains empty, so no existing item gained a source review, rights clearance or acceptance flag.

Additional exact scoped hash: `scripts/check-evidence-integration.mjs` — `882b42405f93118cc5e92afeb247720d2ff6e96d67d078f766cff8d50d19cc0c`.

## Limits

Bounded AI engineering review only. No subject-source or rights clearance, professional/human qualification, real screen-reader/learner session, deployed publication, or acceptance of existing production items is granted. Integration checker/docs/packaging were being prepared separately and are not assumed complete by this source review. Any repair to the frozen code changes the bound hashes and requires an explicit recheck.

## Explicit package and documentation recheck

Independent read-only packaging source review passes with no actionable mismatch. Manifest contains 15 unique regular-file additions and exactly app.js/build.mjs replacements. Independently hashed both accepted-base file objects at facab15e297c645d4826935f2c011a4cf367ee88 and verified their SHA-256 values match the manifest's pinned preimages. All local packaging/documentation links resolve; current reviewed implementation/test hashes remain unchanged.

Implementation contract and integration docs correctly distinguish local production-code integration from deployment or new lesson/source acceptance, empty real registry from synthetic tests, static ESM binding from arbitrary runtime-resource coverage, scoped report linkage from authenticated expertise, and fragment routes from future discoverable static pages. Docs explicitly preserve the zero-real-record parity contract: every old collection shard stays identical in this integration. A future approved nonempty record adds target provenance to its existing shard and therefore needs a separately reviewed precise parity extension; the current checker must not be broadly weakened to permit it.

At this earlier documentation checkpoint the verification document accurately marked the native rehearsal pending. The completed-run log cross-check below supersedes that pending state; no native execution or screenshot inspection is attributed to this reviewer.

### Packaging document hashes at this checkpoint

| File | SHA-256 |
| --- | --- |
| docs/integration/evidence-view.json | `5f1161686d902b7dd2f6287a6c45a64acd1805616411a0f399be2d69fd0be859` |
| docs/integration/evidence-view.md | `7481dd8a27036ce1c913d5689781d9987b30ef6d1b137d7354d2b3a62062598a` |
| docs/architecture/legacy-evidence.md | `f2cf77d1873eb69620c12d3f275febf5a49b67905c0e30ecd43a363078a7025a` |
| docs/verification/universal-evidence.md | `fd9abfcec7399d8fa83021819415ab91da1ecd2b102fd197fc00a3575fe1074a` |

No browser, production-file write or other-worktree action performed by this reviewer; only this report was appended.

## Completed accepted-base rehearsal: independent log cross-check

**Final code and packaging review remains PASS.** Independently read the completed evidence integration report, its universal preflight report and referenced logs. This is independent inspection of the owner's execution evidence, **not an independent native test execution**. No browser was launched or screenshot inspected by this reviewer.

The records match the updated verification document: exact accepted base facab15e297c645d4826935f2c011a4cf367ee88; 431-file additive preflight preserving 5,552 accepted-base files; 101/101 additive offline tests, 13/13 evidence/share-state tests and 12/12 serialized native groups, each with zero failures/skips/cancellations. Their scoped total is 126, not the historical full numerical suite. Baseline/integrated strict logs both show 7,751 written plus 5,823 planned, 531 chapters and 85 collections with zero errors/warnings. Integrated home gzip is 123,749 bytes versus timestamp-dependent baseline 123,748. Static check records 7,688 items with zero errors/warnings.

The successful rehearsal report records 89 existing generated data files preserved with only the declared index/home timestamp exclusions, one added empty evidence.json catalog, and 5,981 unrelated snapshot source files byte-identical after excluding the two pinned replacements. Compared current bytes against all successful-run change hashes: code, tests, manifest, checker and contract/integration docs match; only the authorized reviewer/verification report text changed afterwards. Current verification-document hash is refreshed in the table above. The author reports inspecting all four final screenshots; that is retained as author evidence, not claimed as this reviewer's pixel observation. The separate original/Wave preservation audit was not repeated here.

No discrepancy found between the inspected logs and committed verification results. Real registry remains empty; these engineering results grant no new source/rights/professional/human/learner acceptance or deployment. Only this report was updated.

### Execution evidence hashes inspected

| Evidence file | SHA-256 |
| --- | --- |
| evidence-report.json | `d140a0a5411982ec53cfb16785343bfc2b668d69e1e31a8065355fda39989af7` |
| report.json | `6032c0d8652d6269efbbe7eb2877f5edd69e88d08280a62f7bb8e66765a0edac` |
| check-5.log | `ff872fb672dddedb4764a8376cad3cba466ef723615f2882385d33bed88f5640` |
| evidence-baseline-build.log | `9f7999c34b35868e5d3d52aaf9afbfbfe4fc237a1c9e6739e3fcb21b3af8de51` |
| evidence-integrated-build.log | `01b6258791323660e97ff459cdcc90c3f7ec777da602ae1d18f01a3698480b22` |
| evidence-static.log | `c07e324eb26f65dff0249591e823fd193fa07b34d0d1b1413a466c7a580dc543` |
| evidence-offline.log | `c262a38c674c56e5f4788d4d11a3c09a4c2a46d765676831eccf083102980a46` |
| evidence-native.log | `db4baef3cb33f20da9c8b700bfbea5640e8a31cdb3f60fac4269e696dc192a95` |
