# Sociology 4.12: MusicLab evidence and an authored feedback market

Candidate for independent coordinator acceptance; source flag remains true. No central inventory or generated data is changed.

## Primary source comparison

Read the original Salganik, Dodds and Watts, *Experimental Study of Inequality and Unpredictability in an Artificial Cultural Market*, Science 311:854–856 (2006), all three report pages, especially experimental design and Figures 1–3. The author-hosted combined report/SOM is https://www.princeton.edu/~mjs3/salganik_dodds_watts06_full.pdf; complete 19-page PDF and page-marked extraction retained as `/tmp/atlas-worker-three/musiclab2006.{pdf,txt}`. Also read the actual supporting experimental design, subject experience/recruitment, Tables S1–S2 and inequality/unpredictability passages (SOM pp. 1–6 and 9–12). The two experiments total 14,341 participants: 7,149 and 7,192. The independent condition's popularity is a population-specific quality proxy, not objective intrinsic quality.

The experiment has one independent world and eight influence worlds per experiment, with roughly 20%/10% allocation. Its participants could listen/rate repeatedly and choose whether to download, whereas the widget makes one choice per synthetic listener. Experiment 1's grid versus experiment 2's popularity-sorted influence list are now distinguished. The recruitment-demographic change between experiments is disclosed; results are not promoted to a universal monotone response to an arbitrary numeric feedback parameter. The published unpredictability comparison uses repeated random splits of the independent world, unlike this widget's eight separately generated no-feedback worlds. No raw participant dataset, new significance test or fitted reinforcement law is claimed.

## Repairs

Removed the assertion that the empirical process is exactly preferential attachment, universal prediction failure, and the description of a simulated appeal weight as measured quality. The model is explicitly authored with 48 positive fixed weights and a declared one-choice feedback rule. Original report findings and synthetic diagnostics are separate.

The old horizontal range [0.1,0.9] clipped ten songs in every world; both panels now include all 48 coordinates, all zero shares and complete marker strokes. The no-feedback expectation is normalized exactly. The eight streams are paired by seed across feedback settings: beta zero agrees exactly in both panels. All sizes and continuous feedback values use exact cache keys, with bounded cache size. The unsigned seed is saved/replayed, changes with New worlds and wraps explicitly at its maximum. Arbitrary tie-broken “best/worst song” rankings were removed. Gini and unpredictability retain the original report's mathematical definitions but are plainly finite synthetic metrics.

## Checks

`node --test tests/verification-soc-musiclab.test.mjs`: 2 groups pass, `/tmp/atlas-worker-three/musiclab-math.log`. A separate normalized-CDF implementation checks every choice count at every offered size and beta 0/0.8/1/2; every world sums to the requested count. Independent pairwise absolute-difference sums check all Gini values and cross-world unpredictability. Zero/near-one inverse-CDF endpoints, equal/concentrated shares, coupling, seed changes and invalid domains are checked. The equality fixture permits ordinary floating roundoff in the Gini formula.

`node scripts/check.mjs soc-4.12 --static`: 1 item, zero errors/warnings, `/tmp/atlas-worker-three/musiclab-static.log`.

`node tests/verification-soc-musiclab.mjs`: all six 1450/430/320 px × light/dark matrices pass. Every offered size and feedback corner, critical value 1 and its next representable value, intermediate fractional value, Home/End, actual native range/output/ARIA, all 768 plot observations and expectation coordinates, complete marker/path/text/TeX/page bounds, resampling, remount replay, invalid seed and maximum-seed wrap are checked. Log `/tmp/atlas-worker-three/musiclab-native.log`; screenshots `musiclab-{default,maximum}-WIDTH-THEME{,-panelN}.png` in the same directory. Actual desktop/mobile and light/dark images, including the near-total-concentration endpoint and zero shares, were inspected directly. No human review is claimed.
