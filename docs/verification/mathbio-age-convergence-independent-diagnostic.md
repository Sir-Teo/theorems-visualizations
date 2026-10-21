# Independent MATHBIO 4.14 convergence diagnostic

Checkpoint13 at `d4bceeceeb2dee2d197c974133327f8d4993bb67` remains **FAILED**. I independently reproduced its unchanged single-file convergence failure in a fresh child process. No assertion, model, physical parameter, quadrature rule, default test, source flag or checkpoint result was changed. This concerns MATHBIO4.14; it is not source work or a closure for open MATHBIO3.14. No browser or full-suite rerun occurred.

## Preserved observations

The original checkpoint log records 1 failure among2233 tests, at line13 of `tests/verification-mathbio-source-audit-age.test.mjs`: `Math.abs(c.r-exact)<Math.abs(a.r-exact)` is false. Raw log remains `/tmp/atlas-continuation/checkpoint13-tests.log`, hashed in adjacent evidence. The original run did not save numerical locals. Root separately reported isolated success; that cannot erase its full-suite failure.

I archived exact d4bceece to `/tmp/atlas-new-mathbio-age-diagnostic/source`. Target SHA256 is `0d11ad82d82f6884100454fcdfbf67b694b41761c8593b1cfbe6712bf540795e`; helper SHA256 is `09bf13ef0f6449ec3aaf462aad88177a51a1690f1b90feada0cc2435cee5b19a`. All MATHBIO module and target hashes match before/after all runs. Runtime was Node26.8.2, V8 version pinned in evidence, darwin arm64, same local executable. Nothing in the target/helper uses randomness or wall time, and the actual calculation allocates per-call arrays/results with no shared result cache. A single-file child can reproduce the problem, so the other2232 files are not necessary to trigger it. This does not rule out runtime scheduling/tiering effects.

The finite diagnostic cohort has39 child processes total:

| Cohort | Children | Failures | Interpretation |
|---|---:|---:|---|
| Exact unmodified test, default engine |4|1|`run-1/exact-default-1.log` reproduces the same c-versus-a assertion; all7 tests execute in the child. |
| Exact file with no-maglev, jitless, no-turbofan, stress-maglev |2 per flag,8 total|0|Different engine histories; these small observations do not prove an optimizer cause or waive a failure. |
| Exact file with optimization/deoptimization trace; second trace also disables concurrent recompilation |2|0|Trace shows characteristicAges is compiled to MAGLEV and considered for TURBOFAN_JS; both traced executions pass. No failed compiler-tier trace was captured. |
| Exact file with pause-on-exception inspector |7|1|First observer child fails and saves locals; six later expanded-grid observers pass. Enabling Debugger can change tiering. |
| Exact file, inspector plus stress-maglev |6|0|All six pass; no expanded failing object/grid identity obtained. |
| Console-observed copy, default9/no-maglev1/jitless1 |11|0|Only numerical logging and absolute import paths differ; all assertions remain exact. These are explicitly different histories. |
| Preliminary assert.ok-wrapper smoke |1|0|No failed assertion/locals; preserved separately, not evidence of original-run correction. |

Every child log/status/arguments and numerical observation remains retained. These are bounded diagnostic observations, not a pass-rate criterion or a retry-until-pass procedure. The original checkpoint and the two new failing children remain failures.

## Captured failing values

The first pause-on-exception observer reproduces the identical test-file assertion and materializes its line13 caller frame as follows:

- b=.3, reference `exact=-0.09142626272540091`;
- `[a.r,c.r,d.r]=[-0.09142629277251813,-0.09142629277251813,-0.09142627024681257]`;
- absolute errors `[3.004711721099618e-8,3.004711721099618e-8,7.521411660160737e-9]`.

The paused scope therefore has the coarse result equal to the middle-grid result, and the strict comparison fails by equality. The captured reference and fine rate agree with passing observations. This is much larger than an ordinary last-bit reversal of the expected coarse error. It is not evidence that the tolerance is too tight.

All console-observed copies retain the following normal values (consistent across default and flag controls):

| b | Simpson reference root | h=.2 error | h=.1 error | h=.05 error |
|---|---:|---:|---:|---:|
|.3|−.09142626272540091|1.1957590503874904e−7|3.004711721099618e−8|7.521411660160737e−9|
|1|.16015987007817295|3.9808261553808677e−7|9.99462173023602e−8|2.501328250081869e−8|
|2|.31393061496663677|7.955683130056457e−7|1.996457664743545e−7|4.995873437163567e−8|

Their successive error ratios are3.9796–3.9963, consistent with second-order trapezoid convergence. The normal coarse b=.3 rate is−.09142638230130595, rather than the middle-grid rate materialized in the failing paused frame. Reference Simpson residuals are on the order of2.2e−16. The reference and helper use mathematically equivalent Gaussian/survival factors; the printed error scale does not justify weakening the strict refinement check.

## Diagnosis limits and next boundary

Concrete conclusion: the unchanged single-file failure is reproducible, and its first retained paused frame exhibits a coarse/middle result anomaly. No file mutation, randomness, too-small convergence margin or mathematical model defect was identified. Result binding/return-state corruption associated with execution/tiering is a plausible lead; an engine bug, precise compiler tier and exact failing return object identity are **not proved**. Debugger optimized-frame materialization can itself be misleading, so do not promote these locals to a verified helper-return trace. The expanded observer asks for h/na/nt/age count and a===c but did not capture another failure; all such empty observations remain recorded.

Do not change physical rates, loosen assertions, add a retry, quarantine the failure, force the whole project to jitless or declare checkpoint13 passed on this evidence. No corrective production/default-test patch is justified yet. The smallest separately reviewable next diagnostic would capture per-call requested h, returned grid identity/rate and the failed caller bindings in a minimal reproduction while preserving failure under its declared observer. A test-only numerical-message/refactor proposal may improve future observability, but a passing refactor alone would not establish that this underlying failure is fixed.

## Reproducibility and ownership

Own nondefault utilities are `tests/verification-mathbio-age-convergence-diagnostic.mjs` (15 bounded child configurations) and `tests/verification-mathbio-age-inspector.mjs` (pause on exceptions; set unique AGE_FAILURE_LOCALS). Neither modifies or is a replacement for the default test. Run the diagnostic with an exact archive path and a unique empty output directory. Its aggregate intentionally records failing child exit statuses rather than pretending every child passed. Inspector metadata is saved separately by process PID; parent/child observer files cannot overwrite each other.

Raw root is `/tmp/atlas-new-mathbio-age-diagnostic`. `run-1/results.json`, `run-2/progress.json`, `run-3/results.json` and `run-4/results.json` retain configuration and every outcome. The first observer source was extended only in its on-exception evaluation expression; its earlier text is explicitly reconstructed from that documented insertion as observer-run2-reconstructed.mjs, while observer-final.mjs pins the expanded version. The preliminary wrapper file/log is also retained. Adjacent committed evidence embeds failing locals, normal numerical values, all source hashes, exact counts and a full raw SHA/size manifest. All children completed; no background process/browser/server remains. This diagnosis is separate from lifecycle protocol2710c1ac and all map acceptance work.
