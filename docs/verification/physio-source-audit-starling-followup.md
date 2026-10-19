# Physiology Starling-paper source audit

Resolved after parent integration: **physio-4.20**. The source flag and ledger were reconciled after independent parent reruns; all dependencies and adjacent entries are preserved.

## Primary historical source actually read

Starling (1896), [On the Absorption of Fluids from the Connective Tissue Spaces](https://pmc.ncbi.nlm.nih.gov/articles/PMC1512609/), *J Physiol* **19**, 312–326, [DOI](https://doi.org/10.1113/jphysiol.1896.sp000596). Downloaded all 15 original page scans; read OCR of complete pp. **312–315 and 320–326**, with direct inspection of pp. **315 and 325**. These identify the paired isolated-limb **defibrinated-blood** perfusions, injected oedema fluid, blood dilution, distinct membrane-osmometer experiments, selective permeability argument and original conclusions. The previous summary incorrectly implied that the limb perfusate itself was changed from salt solution to serum. The entry now distinguishes perfusing blood from injected oedema fluid and separates the limb evidence from the osmometer evidence. It also states the paper's qualification concerning protein-rich tissue fluids and lymphatics. No claim to reconstruct the original tables or to validate current clinical physiology is made.

Local HTML `/tmp/atlas-physio-starling1896.html`, SHA-256 `9b56a27dbe9c4b6fb7c2ba0bc0d9d150e213f4d977dd237f6b1cbeafedd229e9`; scan315 `4e0cc39047d02ebe2c0bc8d8d38d79b5b84af340b13dd3e525901aa943b81641`; scan325 `4b7a2921a9ceefbcee63389ff27166286ca5404f5c4c0c14cf1bb4dfe19a6859`.

## Documented later model relation

Weinstein (2017), [A mathematical model of the rat kidney: K+-induced natriuresis](https://pmc.ncbi.nlm.nih.gov/articles/PMC6148314/), *Am J Physiol Renal Physiol* **312**, F925–F950, DOI **10.1152/ajprenal.00536.2016**. Read the complete **Model Calculations** formulation around equations **43–46**: pressure units are mmHg, concentration g/dL, and equation46 explicitly uses the polynomial `2.1c + 0.16c² + 0.009c³`, citing Landis–Pappenheimer1963. This is a primary publication of a computational model using the relation; it is a **secondary reproduction of the historical fit**, and is labelled accordingly. The original1963 empirical fit and applicability to human muscle are not claimed independently validated. The panel is explicitly a frozen classical two-compartment illustration with chosen conductance/interstitial values; the unsupported assertion that its conductance is a measured typical muscle value is removed.

## Model and visual corrections

The weight plot previously clamped its marker to ±100g while the model actually predicts **+636g or −516g** at native control extremes. The full curves and actual marker now remain visible with adaptive vertical bounds. Capillary-pressure handle endpoints have margins; out-of-range zero-flux guide lines are not drawn. Fixed-composition linear time extrapolation and the approximate1mL-to1g conversion are explicit. Comparison-curve labels are staggered horizontally for legibility.

## Validation

- `node --test tests/verification-physio-source-audit-starling.test.mjs`: **3 groups pass**. Exact polynomial anchors0/7/10g/dL, positive slope and convexity, all8 pressure/protein/duration corners with independently evaluated pressure balance and signed mass/100g-to1kg conversion, exact balance zeros, and time/mass/conductance scaling. The extreme gains above are asserted explicitly.
- `node tests/verification-physio-source-audit-starling.mjs`: **2 native light/dark groups pass**. All8 actual concentration/duration/pressure corners per theme, including native pointer drags to both pressure endpoints; independent displayed flux and mass checks; complete curve and unclamped marker/handle-radius containment, finite readouts, no page or math-render errors.
- Inspected original source scans315/325 and full-size +636g/light and −516g/dark screenshots. Files `/tmp/atlas-physio-starling-4.20-{low,gain,loss}-{light,dark}.png`.
