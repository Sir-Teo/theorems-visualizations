# Geography prerequisites — producer boundary

Sixteen genuinely consumed prerequisites were added across sixteen written GEOG items. Local counts move **9/16/19 → 25/32/35** (written-to-written / written-to-known / whole syllabus). These are producer counts pending independent immutable review. No source closure or global acceptance is claimed.

Complete target statements/proof ideas and consumer statements/ideas/scopes were read. Each addition identifies a step already used by the existing argument, rather than an unrelated mathematical association.

| Consumer | Added prerequisite | Consumed step |
|---|---|---|
|1.4|vcalc-1.2|The dot-product angle identity gives the spherical cosine law from unit coordinates.|
|1.7|vcalc-2.8|The nonzero ellipse gradient identifies the geodetic normal before comparing latitude slopes.|
|1.9|prob-2.2.1|Independent finite-variance daily clock errors give square-root standard-deviation growth.|
|1.10|ladr-6.61|A linearized range update projects the residual onto the Jacobian column space.|
|2.1|pma-6.21|The secant antiderivative evaluates endpoint isometric-latitude differences.|
|2.3|prob-2.2.1|Coordinate variances of independent displacement errors add; biases/correlations behave differently.|
|2.5|pma-5.5|The log-sine derivative gives angular sensitivity of each triangulation sine ratio.|
|3.4|pma-9.11|The normalized differentiability remainder makes the derivative ellipse a first-order image.|
|3.5|ladr-7.70|Equal singular stretches give an orthogonal scalar map; unequal stretches distort some angles.|
|3.6|pma-10.9|Change of variables turns the local determinant into an area integral on regular injective charts.|
|3.7|vcalc-1.8|Integrating preserved tangent speed turns a unit indicatrix into local length preservation.|
|4.9|pma-5.5|The inner Miller latitude factor cancels its outer reciprocal when differentiating.|
|5.5|pma-6.21|Integrating the azimuthal equal-area equation determines the nonnegative radial branch.|
|5.8|ode-1.3|Separating the conformality ODE gives the exponential isometric-latitude radial law.|
|5.9|pma-6.21|Integrating the conic equal-area equation makes radial square affine in sine latitude.|
|6.2|pma-5.11|Positive interior derivative proves uniqueness of the Mollweide root, separately from Newton convergence.|

The explanations state the needed domains and qualifications: positive ellipsoid axes/nonzero gradient, finite-variance independent time increments, full column rank for a unique position/clock update, latitude/bearing exclusions for the rhumb integral, nonzero sines for log sensitivity, first-order rather than exact finite-circle shape, orientation convention versus general orthogonal maps, injective nonsingular charts and compact continuous densities for change of variables, and the relevant positive radial branches and nonzero conic constant. The 1.7 appendix explicitly notes that all three latitudes coincide when a=b; its strict separation concerns a>b. No model, historical measurement or numerical convergence claim is broadened.

## Exact raw dependency synchronization

All sixteen owned raw item lists and corresponding raw syllabus lists are checked for complete exact equality. The only inherited omission is GPS 1.10: `stat-12.2` was already in the item and consumed by its existing regression argument, but absent from its syllabus row. That existing dependency is copied into the row along with the genuinely new `ladr-6.61` edge. The repair adds **no distinct edge** to the inventory counts, because the item already supplied it. No alias substitution or unrelated row repair was made.

## Verification and preserved behavior

- `node tests/verification-geog-preservation.mjs BASE_ARCHIVE ROOT docs/verification/geog-prerequisites-evidence.json`: all **48 full item objects/functions**, source flags, helper bytes and module bytes outside ideas/deps preserved. Every original idea remains as a prefix; only its concrete prerequisite explanation is appended. All sixteen exact expected full raw dependency lists match; all other syllabus data is unchanged. This guard requires an explicit baseline and is excluded from default testing.
- `node tests/verification-geog-math.mjs`: **5,600 independent checks**, without GEOG helper imports. They cover coordinate-dot/haversine identities, gradient/tangent orthogonality, independent clock/vector accumulation, least-squares normal equations/Pythagoras, rhumb integrals, sine-ratio sensitivity, uniform differentiability remainder, singular-stretch geometry, injective-chart area and compact-density substitution, arc-length invariance, Miller differentiation, both equal-area radial integrations, separated conic solutions and monotone-root bracketing.
- Strict build: **0 errors / 0 warnings**. Focused static checks: **48 items / 0 errors / 0 warnings**.
- `node tests/verification-geog-native.mjs ROOT OUTPUT`: **32 fresh native cases**, actual **320px** viewport, light/dark. All **32 changed idea outputs fit**, including all mathematics, with no runtime/TeX/blank failures. The utility renders and verifies the provenance of the **actual strict-built statement string** as well; it does not replace it with a rewritten fixture.
- All **64 own element images** were personally inspected: 32 changed ideas plus 32 original built statements. Seven inherited statement displays **do overflow and clip in both themes**: 1.4 (524px content in281px), 2.3 (290), 4.9 (310), 5.5 (330), 5.8 (747), 5.9 (593), 6.2 (557). Those failures are retained in logs/output and are **not passed** by this report. Coordinator authorized a separate equivalent-wrap successor after this prerequisite boundary. This commit changes no statement.
- Existing `map-distortion` bridge uses changed 3.4, 3.6 and 3.7. Its full eight-step walk was reviewed: the added differentiability, area-integral and speed-integral inputs substantiate the unchanged ellipse/area/local-similarity notes. No bridge changes are necessary; all bridge IDs and notes remain unchanged.

Mapping, explicit guard specification, image SHA256s, inherited overflow measurements and raw log paths are in `geog-prerequisites-evidence.json`; output is under `/tmp/atlas-new-imaging-source/geog-native`. Browsers closed after the probe. BEHAV/GEO/GEOL boundaries, source-audit helpers, source flags, shared runtime, global inventory and accepted ledgers were not edited. Independent peer acceptance is required; this is prerequisite and changed-prose evidence only.
