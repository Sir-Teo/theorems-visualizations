# Sociology 4.5–4.6: original small-world models and navigability

Status: source comparison and independent mathematical checks complete; native UI checks cover both themes and three widths. The two verify flags remain true for independent coordinator acceptance. The coordinator owns the combined queue.

## Sources actually inspected

- Watts and Strogatz, *Collective dynamics of ‘small-world’ networks*, Nature 393 (1998), 440–442. Original scan: https://www.cs.cornell.edu/courses/cs6241/2020sp/readings/Watts-1998-smallworld.pdf. Read the structural-model text and the complete Fig.1–2 legends on pp.440–441, including clockwise distance laps, fixed edge count, mean local clustering, all-pairs distance, twenty realizations, n=1000 and k=10. Inspected actual p.441 pixels `/tmp/atlas-soc-smallworld-sources/watts-strogatz1998-page2.png`. The site's n=24/48/96, k=4/6 plots are authored finite diagnostics, not a reproduction of Fig.2 or empirical networks. No claim is made to audit the paper's epidemic, oscillator or empirical datasets.
- Jon Kleinberg, *The Small-World Phenomenon: An Algorithmic Perspective*, complete author paper: https://www.cs.cornell.edu/home/kleinber/swn.pdf. Read pp.4–6 (bounded square, directed contacts, permissible information, averaging, Theorems2–3) and pp.8–12 (deferred decisions, greedy phase argument, both lower-bound arguments). Inspected actual p.12 pixels `/tmp/atlas-soc-smallworld-sources/kleinberg-swn-page12.png`. Side length n is distinct from the n² vertices; local radius and long-contact count are both one here. Sources and targets are independently uniform for theorem expectations.
- Easley and Kleinberg, June10 2010 draft, chapter20: https://www.cs.cornell.edu/home/kleinber/networks-book/networks-book-ch20.pdf, §§20.3–20.4 and20.7. Used as supporting exposition only; the full author paper supplies the theorem and proofs. Local PDF and extracts are `/tmp/atlas-soc-smallworld-sources/easley-kleinberg20.*`.

These references were re-opened online. The original PDFs and page images are retained in `/tmp/atlas-soc-smallworld-sources/`; they are source material, not committed assets.

## Correct mathematical and finite conventions

4.5 considers every clockwise original edge exactly once in distance-lap order; admissible targets exclude loops and existing edges. Edge count remains nk/2. Current topology determines admissibility, and a blocked draw retains its original edge. Fixed uniforms couple probabilities within a seed without claiming independent samples across p. Fully rewired graphs are not Gilbert independent-edge graphs. The separate ring-retained mode samples a fixed distinct candidate list, retains the lattice and genuinely nests. It is explicitly authored, with no Newman–Watts attribution.

All-pairs BFS and all neighbourhoods are counted. Mean local C sets degree<2 contributions to zero; transitivity uses total wedges. Disconnected global L is reported as infinite, with reachable-pair mean separate. Exact ring distances and local clustering are derived in the offered finite domain. The source's empirical small-world regime is not promoted to an exact cubic clustering identity, monotone clustering law or universal finite threshold.

4.6 uses a nonwrapping16×16 square, four/boundary local contacts and one fixed directed long contact per vertex. The inverse-power law sums every permissible endpoint, including local neighbours. Every selected greedy route is complete, strictly decreases integer distance and stays delivered after its final hop. Dyadic bars sum the finite endpoint law, with boundary effects retained. The all-pairs greedy and directed BFS means are over all65,280 distinct ordered pairs in one graph; no sample-success or asymptotic certification is inferred.

The r=2 proof gives an explicit boundary-valid target-ball square count, hence phase success at least1/[576 ln(6n)]. Its expectation uses the tail identity, a geometric series and linearity; independence of phase durations is not claimed.

The original author's p.12 tail calculation visibly loses a factor4 between its sum and integral. The authored proof retains that factor. Independent review also corrected the preserved draft's noninteger integral threshold: state the bound for integer m, choose m=ceil(n^gamma) and lambda=min(r−2,1)/32. Then the union probability is at most1/8, m≤2n^gamma, and total travel remains below n/4. Constants depend on fixed r; the source exponents are unchanged. The proof is written independently and is separated from the finite visualization.

Seeds validate as unsigned32 integers; all unsupported finite helper inputs fail before construction. Seed adapters support reproducible saved state. The demonstration's seeded32-bit uniforms/binary64 arithmetic are disclosed separately from ideal probability assumptions.

## Verification and evidence

- `node --test tests/verification-soc-smallworld-model.mjs`: six passing groups. Final log `/tmp/atlas-worker-three/smallworld-model-final.log`. Independent adjacency-matrix/Floyd computations cover distances, reachability and clustering. Checks include every finite threshold regime of18 ring skeletons per mode, target-law reconstruction, all65,536 routing queries at seven exponents, endpoint probability sums and quantiles, boundary counts, integer jump thresholds and invalid inputs.
- `node tests/verification-soc-smallworld.mjs 4.5`: six passing width/theme configurations. Log `/tmp/atlas-worker-three/smallworld-ui45.log`.
- `node tests/verification-soc-smallworld.mjs 4.6`: six passing width/theme configurations. Log `/tmp/atlas-worker-three/smallworld-ui46.log`.
- Native range events, exact continuous values, integer endpoints, Home/End, every construction/size/degree combination, source=target, all trace steps, seed changes, valid replay and invalid saved seeds are covered. Assertions inspect actual draws, readouts, DOM/output/ARIA and all path/arrow/marker/text/TeX/page bounds. Browser exceptions and KaTeX errors fail the run.
- Screenshots `/tmp/atlas-worker-three/soc-smallworld-4.5-*.png` and `soc-smallworld-4.6-*.png`: default, rewired/retained, full-trace and delivered states, full-page and each stage separately, at1450/430/320 in light/dark. Actual images were visually inspected, including desktop full pages and mobile panels in both themes.
- Focused static validation: `node scripts/check.mjs soc-4.5 soc-4.6 --static`, `/tmp/atlas-worker-three/check-smallworld-static.log`. Generated data is not committed.

The initially attempted global browser check was stopped after recognizing that the isolated branch should use focused validation; it is not reported as a completed global check. Source flags elsewhere are unchanged.
