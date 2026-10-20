# Sociology 4.13: paired discrete log growth and the Zipf limit

Candidate; source flag retained for coordinator acceptance. Only4.13, its syllabus row/source-header note, its unused unauthenticated city-data constant, an isolated helper and unique evidence files change.

## Original read and access scope

Read Gabaix, *Zipf's Law for Cities: An Explanation*, Quarterly Journal of Economics114(3):739–767 (1999), actual complete author-linked publisher PDF through web PDF retrieval: https://xgabaix.scholars.harvard.edu/sites/g/files/omnuum7761/files/xgabaix/files/zipfs_law.pdf. The author's publication record links this PDF at https://xgabaix.scholars.harvard.edu/publications/zipfs-law-cities-explanation. Read §II.1 pp.743–745 including normalization/steady-state assumptions and footnotes14/18; §III.1 pp.748–750 including Eq.10, Proposition1, its proof and finite-barrier qualifications; and §III.4 pp.751–753 including Proposition4 and the finite rank-ratio discussion. Local direct PDF transport was403 and an academic mirror failed DNS; no retained local PDF or source-pixel inspection is claimed. The actual primary PDF text was accessible through web retrieval and was read, not replaced by an abstract or secondary summary.

The original distinguishes size normalized by expected urban population, continuous reflection, a negative drift, and a finite-barrier exponent that approaches1 in a limiting regime. It does not justify declaring a finite discrete max(1,proposed size) simulation an exact stationary Zipf theorem. It also explicitly warns that ranked city-size ratios fluctuate even under the ideal distributional law. The item makes only these scoped source comparisons; the paper's full economic model, later extensions, empirical city data and convergence rates are not newly audited or claimed.

## Repairs and own finite mathematics

The old unauthenticated top-city overlay, least-squares rank-tail verdict and automatic floor-to-Zipf conclusion are removed. All1000 synthetic cities start at size1 and receive the same declared mean-preserving ideal multiplicative increments. With ideal independent normal inputs, log size has mean−t sigma²/2 and variance t sigma², and the exponential-normal identity gives mean size1. These elementary calculations are separate from finite seeded Box–Muller draws.

Computation stays in log coordinates to preserve every small value. The discrete floor projects each proposed log size below zero to zero after that step; it alters growth near the floor and is explicitly not a continuous reflection solver or total-population normalization. Every final rank is shown alongside its paired no-floor comparison. Exactly the first three complete histories are shown and labeled; the other997 histories are not represented as plotted. Endpoint dots make time0 visible. The slope−1 guide is anchored at rank500 and is not a fit. Zero time/shock scale, finite-model moments, all floor events, seeds and displayed histories are explicit.

Independent checks use the identity for projected walks Y_t=S_t−min(0,S_1,…,S_t), rather than repeating the production max recurrence. This checks every final city and every selected trace step for every offered time and sigma0/0.2/0.4. Algebraic same-uniform coupling and invalid domains are also tested.

## Evidence

`node --test tests/verification-soc-growth.test.mjs`: 2 groups pass, `/tmp/atlas-worker-three/growth-math.log`. `node scripts/check.mjs soc-4.13 --static`: 1 item, zero errors/warnings, `/tmp/atlas-worker-three/growth-static.log`.

Final native evidence follows after all matrices finish. No empirical prediction, human review or asymptotic certificate is claimed.

`node tests/verification-soc-growth.mjs`: all6 matrices pass at1450/430/320px light/dark. Every offered time (including0/1000), floor on/off, zero/intermediate/maximum sigma, all1000ranks, every plotted trace step and endpoint, full guide/path/glyph/text/TeX/page bounds, actual native range/output/ARIA, switch-label clicks, Home/End, exact replay, malformed seed and maximum-seed wrap are checked. Logs `/tmp/atlas-worker-three/growth-native.log`; screenshots `growth-{default,floored,unbounded}-WIDTH-THEME{,-panelN}.png`. Actual desktop/mobile light/dark rank plots, floored and unbounded histories, and small log sizes were inspected directly. Within-browser replay stays exact; independent process arithmetic comparisons allow the declared small tolerance.
