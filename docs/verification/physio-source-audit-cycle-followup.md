# Physiology cardiac-cycle source audit

Resolved: **physio-3.1**. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Sources actually read

Patterson and Starling (1914), [On the mechanical factors which determine the output of the ventricles](https://pmc.ncbi.nlm.nih.gov/articles/PMC1420422/), original pp. **358–359**, describes the ventricular contraction/aortic opening/ejection/closure/relaxation sequence. Reread both full pages and directly inspected original p.358. Source hashes are in `physio-source-audit-patterson-followup.md`; p.358 SHA-256 `dad500fb3098c30c0f5c1a8f66918414583d0aabe4b4be4410f55a988404715e`.

Keener–Sneyd [author manuscript](https://www.math.utah.edu/~keener/books/control.pdf), complete **section11.4 pp.490–492**, including Figure11.5 caption and equations11.33–11.37, read for the pressure–volume phase interpretation. This is authored textbook support, not a new inspection of the experimental figure's cited Sagawa source. No original Wiggers plate, publication priority, ECG or phonocardiographic recording is claimed reconstructed. Removed the unresolved historical-credit/date sentence rather than assigning an unverified date.

## Corrections and validation

The panel now describes its actual12-beat warmup and1ms sampled events; it no longer promises an exact periodic orbit. It reports residual end-to-start volume drift. A beat always takes four display seconds, so the previous constant fivefold-slowdown claim was false away from75/min and is corrected. Synthetic Gaussian ECG and damped sound bursts are explicit. The valve readout now uses the same1e-6 flow threshold as event detection, replacing a1mL/s threshold that could label a flowing valve shut. Volume bounds and time margins contain all full curves and event dots.

- `node --test tests/verification-physio-source-audit-cycle.test.mjs`: **3 groups pass**. All71 actual integer rates50–120/min: ordered events, positive durations summing to60/HR; every sample's valve state independently compared with pressure-gradient/resistance, nonnegative flow, integrated mass balance and exactly constant volume when both valves are closed. Maximum residual drift is0.015954mL and independent trapezoidal flow-balance discrepancy is below0.01mL. Schematic trace finiteness and the model's rate-dependent timing are checked.
- `node tests/verification-physio-source-audit-cycle.mjs`: **2 native light/dark groups pass**. True50/120 controls, visible shading-toggle clicks and native play/pause; independent pressure/valve readout checks, complete aligned curves/event-marker containment, finite readouts and no page/math errors.
- Inspected original p.358 and full-size low/light and high/dark screenshots: `/tmp/atlas-physio-cycle-3.1-{low,high}-{light,dark}.png`.
