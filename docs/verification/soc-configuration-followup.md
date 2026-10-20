# Sociology 4.14: retained stub matching and exact edge-end averages

Candidate with verification flag retained. Only this item, its syllabus row, isolated helper and unique checks/report change.

## Sources actually compared

Read Newman, Strogatz and Watts, *Random graphs with arbitrary degree distributions and their applications*, actual arXiv:cond-mat/0007235v2 (7May2001), https://arxiv.org/abs/cond-mat/0007235v2. Complete PDF and page-marked text retained at `/tmp/atlas-worker-three/config2001.{pdf,txt}`. Read §II opening ensemble scope, §II.A pp.3–4/Eqs.8–9 for edge-end size bias and remaining incidences, §II.C's large-N/tree-like qualification, and §II.G pp.8–9's actual numerical stub construction/even-total condition. The source's broad “all graphs” shorthand is not used to claim uniformity over multigraph adjacency matrices; the declared model is uniform over labeled-stub matchings.

Read Feld, *Why Your Friends Have More Friends Than You Do*, AJS96(6):1464–1477 (1991), original complete JSTOR-layout scan hosted by UVM: https://pdodds.w3.uvm.edu/research/papers/others/1991/feld1991a.pdf. Relevant pp.1468–1472 distinguish the pooled friend distribution, its exact mean/variance identity, and the different average of individual neighbor averages. PDF/text `/tmp/atlas-worker-three/feld1991.{pdf,txt}`; actual p.1470 formula/footnote pixels `/tmp/atlas-worker-three/feld1991-variance-page.png` were inspected. No original Coleman data, unread Bender/Canfield/Bollobas/Molloy–Reed publication, historical priority or empirical-friendship replication is claimed.

## Mathematical and implementation corrections

The old widget dropped loops and repeated edges, thereby changing the chosen degrees, and applied an unqualified asymptotic “giant iff” criterion to a finite simplified graph. It also clipped degree tails above20 and some neighbor means and could suggest every vertex's neighbor mean was a fixed constant. These are replaced by an explicitly finite multigraph calculation.

Every labeled stub is retained and paired once. Self-loops contribute two incidences; repeated pairs are preserved and drawn separately with curves. Every vertex, edge, occupied degree and endpoint mass is included. All profiles have bounded degrees0–4 and declared even totals. No parity repair or simple-graph conditioning is hidden. Five authored profiles include all isolates, constant degree1/2, half0/4 and half1/3. The all-degree2 profile and both mixtures have mean2 with different variation. No empirical degree family is asserted.

For D>0, uniform edge-end degree has exact probability k p_k/mean and mean sum(k²)/sum(k)=mean+variance/mean, for every matching. This is pooled incidence sampling, not an individual-neighbor guarantee. Zero-stub graphs have an undefined edge-end distribution and a largest actual component of one vertex. Actual connected components use the retained multigraph; no fixed-point solve or asymptotic giant estimate is presented.

Uniformly shuffled labeled stubs produce uniform perfect matchings because each has the same 2^M M! permutation preimages. Distinct multigraph adjacency matrices are not generally equally probable. Finite seeded pseudorandom sampling and its limited ensemble coverage are explicitly scoped.

## Verification

`node --test tests/verification-soc-configuration.test.mjs`: 3 groups pass, `/tmp/atlas-worker-three/configuration-math.log`. All24 four-stub permutations yield three matchings eight times each; the two resulting multigraph matrices occur16 versus8 times, verifying the important distinction. For every offered size/profile and three seeds, independent degree reconstruction, endpoint enumeration and union-find components check all retained data. Loop/repeat counts, every unique stub ID, every curve endpoint, seeded replay and malformed domains are checked.

`node scripts/check.mjs soc-4.14 --static`: 1 item, zero errors/warnings, `/tmp/atlas-worker-three/configuration-static.log`.

Final native evidence follows after completion. No human review or empirical/asymptotic certificate is claimed.

`node tests/verification-soc-configuration.mjs`: all6 matrices pass at1450/430/320px light/dark. Every profile/size, retained stub/edge path and vertex, all degree/endpoint bars including the undefined no-edge case, full glyph/path/text/TeX/page bounds, real choice/resample actions, exact replay and malformed/maximum seed state are checked. Log `/tmp/atlas-worker-three/configuration-native.log`; screenshots `configuration-{default,mixture,isolates}-WIDTH-THEME{,-panelN}.png`. Actual desktop/mobile and light/dark plots, looped graphs, isolates and distribution endpoints were inspected directly. No checks were relaxed for clipping or discarded edges.
