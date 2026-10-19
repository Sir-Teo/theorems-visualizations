# Physiology myogenic-response source audit

Resolved: **physio-4.16**. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Primary source actually read

Bayliss (1902), [On the local reactions of the arterial wall to changes of internal pressure](https://pmc.ncbi.nlm.nih.gov/articles/PMC1540533/), *J Physiol* **28**,220–231, DOI **10.1113/jphysiol.1902.sp000911**. Downloaded all12 original page scans; read complete pp. **220–222 and230–231**, and directly inspected original pp. **220 and231**. The paper reports local reactions after denervation and in excised arteries, and distinguishes passive distension from the slower reaction of muscle. Its own first page mentions a1901 preliminary report, so no unsupported assertion of first observation in1902 remains. No historical speculation about cerebral innervation is asserted as current fact.

The entry now limits the source claim to local myogenic reactions. It removes the unsupported universal60–160mmHg whole-organ plateau and labels the radius law, reserve, gain, time constant and pressure band chosen model functions, not human measurements or Bayliss data.

Local HTML `/tmp/atlas-physio-bayliss1902.html`, SHA-256 `058921b7d3fdb77cbe29e0c94189b8e87340f233c12d05965e9b4751df7ae7e9`; scan220 `e6d00f8415d16712f645ccc8c60e63d452188699641ef99777a82c22aee94730`; scan231 `ecd55f265fb5e12ed12fa11966914132ffb70ecce2b7b7d81456d6b1a338b36e`.

## Corrections and validation

Replaced the biased explicit-Euler step startup with the exact first-order active-tone response. The passive radius jump occurs at5s while active tone remains continuous. The readout distinguishes initial flow, the value55s after the step and the asymptotic target; at the slowest control, flow is1.35 after55s although the target is1.00. Adaptive bounds expose the complete passive curve, whose high-pressure flow6.28 exceeded the old3.2 axis limit. The finite-interval logarithmic gain is distinguished from the chosen gain when radius limits activate.

- `node --test tests/verification-physio-source-audit-myogenic.test.mjs`: **3 groups pass**.601 pressure samples independently check the fourth-power law, passive gain0 and unclamped logarithmic identity; all16 gain/reserve/time/pressure corners check initial jump, one-time-constant decay and asymptote; independent fine-step Euler tone integration checks the exact trajectory and exposes incomplete55s settling.
- `node tests/verification-physio-source-audit-myogenic.mjs`: **2 native light/dark groups pass**. All16 actual gain/reserve/tau/pressure-step corners and native pressure-handle drags to both20/220mmHg endpoints; independently evaluated exact exponential/flow and full curves/marker/handle containment; finite readouts, no page/math errors.
- Inspected full-size low/light and high/dark screenshots: `/tmp/atlas-physio-myogenic-4.16-{low,high}-{light,dark}.png`.
