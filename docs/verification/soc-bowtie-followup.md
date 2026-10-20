# Sociology 4.16: exact finite bow-tie decomposition

Candidate; source flag retained for independent acceptance. Changes are confined to this item, its syllabus row, isolated helper, unique tests and report.

## Original source

Read Broder, Kumar, Maghoul, Raghavan, Rajagopalan, Stata, Tomkins and Wiener, *Graph structure in the web* (WWW9, 2000), actual original HTML at https://archives.iw3c2.org/www9/w9cdrom/160/160.html. Read §§1.1 and 1.3 definitions, §2 component/BFS methods, and §3 interpretation including the Figure 9 legend, complete region table and derivation, plus §§3.1–3.3. Complete HTML and extracted text retained at `/tmp/atlas-worker-three/broder2000.{html,txt}`. Source figure pixels and a reconstruction of the raw crawl are not claimed as reviewed.

The May 1999 table gives 56,463,993 core, 43,343,168 IN, 43,166,185 OUT, 43,797,944 TENDRILS including tubes, and 16,777,756 outside the giant weak component; these sum to 203,549,046. The original determines weak/strong components and uses BFS reach-set inference to derive IN/OUT and the residual. It does not supply an exact separate tube count in this table. The item preserves that five-group comparison and does not invent a sixth empirical percentage.

## Repairs

The previous helper sampled only six high-degree vertices while claiming a largest SCC, and returned no core whenever the sampled SCC size was one. The new isolated Tarjan decomposition visits every vertex and directed arc; equal-size components use an explicit smallest-index tie rule. Every finite graph has a selected largest SCC, including singleton cores. The weak component containing that selected core is explicitly distinguished from a guaranteed largest weak component. All IN, OUT, residual-tendril, tube and outside counts follow actual forward/reverse reachability; tube searches avoid the core.

The speculative heavy-tail explanation and unqualified asymptotic branching prediction are removed. The declared finite directed graph draws each non-loop ordered pair with probability c/(n−1), so c is an expected degree, not the realized mean. Source crawl and synthetic graph are clearly distinguished. All vertices are displayed and every directed link can be shown with an arrow. The old bar ceiling at 0.6 that clipped dense cores is removed. Horizontal comparisons preserve all five graph/crawl groups, including zero and near-total shares. All parameter values use exact cache keys; seeded state, resampling and wrap are explicit.

## Evidence

`node --test tests/verification-soc-bowtie.test.mjs`: 3 groups pass, `/tmp/atlas-worker-three/bowtie-math.log`. Independent all-source searches form mutual-reachability equivalence classes, rather than Tarjan lowlinks, and check every SCC/class for all offered sizes, c below/at/above 1 and both endpoints, two seeds. Separate searches excluding the core check tubes. Adversarial high-degree acyclic vertices with a hidden largest cycle expose the old six-vertex heuristic. Fixtures cover singleton/tied cores, loops, IN/OUT/tubes/tendrils/outside components, exact published total, nested seeded graphs, and malformed domains.

`node scripts/check.mjs soc-4.16 --static`: 1 item, zero errors/warnings, `/tmp/atlas-worker-three/bowtie-static.log`.

`node tests/verification-soc-bowtie.mjs`: 6 matrices pass at 1450/430/320 px in light/dark. All offered sizes, c endpoints/critical neighborhoods, every drawn vertex/link/class and grouped bar, complete glyph/arrow/text/TeX/page bounds, real switch-label click, Home/End, exact state replay, malformed seed and maximum-seed wrap are checked. Log `/tmp/atlas-worker-three/bowtie-native.log`; screenshots `bowtie-{default,dense}-WIDTH-THEME{,-panelN}.png` in the same directory. Actual desktop/mobile light/dark graphs and shares were visually inspected. Initial testing targeted the styled checkbox's covered input rather than its clickable label; the test was corrected to use the actual switch label, without forcing clicks or modifying runtime behavior. No human review or empirical recrawl is claimed.

## Independent acceptance, 20 October 2026

Coordinator reviewed 14c47bb + 21bff6 in an archive of exact combined candidate eecb09a. Broder original HTML definitions, region table and derivation were independently read. An additional Floyd–Warshall oracle exhaustively checked all 4165 loop-free directed graphs on one through four vertices, including tied cores, weak components and tubes. All 11 batch mathematics groups passed afresh. Each item passed fresh 320px light/dark browser matrices, including actual controls, exact saved state, malformed recovery and full glyph/path/text/TeX bounds. All eight fresh full-page outputs were inspected, including dense core shares, empty/full shelves, projected/unbounded walks and retained loops/isolates. Native test output paths alone were relocated inside the archive; production code was unchanged. Evidence: `/tmp/atlas-coordinator/soc-last-peer-{math,extra,native}.log` and `soc-last-peer-images/`. No actionable findings remain in the scoped claims. The coordinator may clear the source flags.
