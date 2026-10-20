# Finance 5.13 — Bachelier's Gaussian model, options and barriers

Independent parent audit passed for **fin-5.13**: five mathematical groups, four native light/dark and wide/narrow groups, and the one-item static check pass. Parent read the original printed pp.31–43,45–51 and70–75, inspected original formula images38/51/75, read the actual written heat-kernel prerequisite, and inspected final high-volatility narrow/dark and tiny-tail wide/dark screenshots. Source flag and ledger are reconciled; no human approval is required.

Scope: only object 5.13, its new helper import and relevant source notes in `content/fin/ch05-c.js`; only row 5.13 in `content/fin/syllabus.js`; new `content/fin/source-audit-bachelier.js`, `tests/verification-fin-bachelier.{test.mjs,mjs}` and this report. Root independently owns concurrent 5.1/5.14 changes. Edits were narrow patches against fresh file reads. No Git, central ledger, master-plan, build or generated-data changes were made by this agent.

## Primary evidence and its limits

Read the actual French original [Louis Bachelier, *Théorie de la spéculation*, Annales scientifiques de l'École Normale Supérieure, third series 17 (1900), 21–86](https://www.numdam.org/articles/10.24033/asens.476/), from its complete [Numdam PDF](https://www.numdam.org/item/ASENS_1900_3_17__21_0.pdf). Local `/tmp/atlas-fin-bachelier1900.pdf`, 67 PDF pages including the cover, SHA-256 `03f1b9542d2c374d61a276fd6c52d8936e1298bfaafd8efdc74b8b27e38faffd`. Text is `/tmp/atlas-fin-bachelier1900.txt`. The audit read printed pp. 31–43, 46–51 and 70–75, with additional pp. 44–45 read during the final pass; it does **not** claim complete reading of all later applications or reproduction of the thesis's empirical tables.

The source distinguishes quoted prices from coupon/report-adjusted **cours vrai** (pp. 32–35), derives its Gaussian and square-root scaling (pp. 35–41), its diffusion equation (pp. 45–49), general-prime valuation and the simple premium (pp. 49–51), and the full-interval crossing relation (pp. 70–75). Original formulas on printed pp. 35, 38, 46, 50, 51 and 75 were inspected in `/tmp/atlas-fin-bachelier1900-p{16,19,27,31,32,56}.png`. These images resolve OCR-damaged symbols and integral limits.

Acquisition: `curl -fsSL https://www.numdam.org/item/ASENS_1900_3_17__21_0.pdf -o /tmp/atlas-fin-bachelier1900.pdf`. The bundled Python's `pdfplumber.open(path)` and each page's `extract_text()` produced the text, retaining PDF-page delimiters. For the cited images, `pdf.pages[i].to_image(resolution=115).save(path)` used zero-based indices 15,18,26,30,31,55. PDF page n corresponds to printed page n+19 after the cover.

The former defense-date/Poincaré claim, categorical “before 1900 markets were descriptive,” rediscovery history and generic recommendation of a different model were removed from this object because they are unnecessary to explain the actually read results. Historical bibliographic metadata are verified by Numdam. The teaching process starts at **100 arbitrary price units**, with zero interest and no costs; it is explicitly an authored modern extension, not a calibrated French-rente series or a reconstruction of historical contracts. Arithmetic prices can be negative.

## Source-to-model mapping

Modern notation is `S_t=100+sigma*W_t`, with standard deviation `sd=sigma*sqrt(t)` and Gaussian density `q`. Bachelier's original coefficient **k is a positive expected gain**, not sigma: `k=sigma/sqrt(2*pi)`. The original simple premium `k*sqrt(T)` is therefore the modern at-the-money call `sigma*sqrt(T)/sqrt(2*pi)`.

For his general prime, writing the exercise offset `m=K−100` maps the original zero expected net payoff to `C=E[(S_T−K)+]`. Integrating the Gaussian gives `C=(100−K)Phi(d)+sd*phi(d)`, `d=(100−K)/sd`. This separates the source contract/mapping from the modern notation and freely chosen simulation parameters.

The actual written prerequisite `pde-3.3`, **The heat kernel**, was read in `content/pde/ch03.js`. Setting its diffusivity `D=sigma²/2` yields precisely the displayed Gaussian and `q_t=D*q_xx`. The idea uses this formula directly; independent normalization, variance and derivative tests check it. It is a genuine added dependency, synchronized in the syllabus. `prob-3.4.1` supplies the independent-step normal approximation, while `fin-5.2` provides the random-walk context. No planned `stoch-13.7` dependency was introduced.

The barrier event is explicitly **an upper exceedance** `max(0≤s≤T) S_s≥K`. For K>100 its exact continuous probability is `2*Q((K−100)/sd)`. For K≤100 it is one because time zero is included. This does not assert that a lower level has already been visited exactly. Daily grid observations can miss between-day excursions; their finite Monte Carlo estimate is reported separately from the continuous analytic benchmark. The old unconditional doubling could exceed 100%, and its “a little below” monitoring description was unjustified.

## Numerical and visual repairs

The inherited density on the time-path panel was entirely absent: `Stage.fn` interpreted its domain 75–125 as time x even though that panel's x-range was 0–60, and returned y at most 68.4 below its price range 75–125. Its horizontal histogram also extended beyond x=60 at the final horizon. At sigma=2 with seed1, the first 60 displayed paths ranged approximately **58.40–136.65**, while 387 of the 4,000 terminal values fell outside the old histogram range. Those observations were silently discarded.

The new three-panel construction uses distinct physical quantities:

1. **Time versus price:** 60 of the 4,000 daily paths over all 60 days, one/two-sigma envelopes, and the selected-horizon line. Bounds include every displayed point and envelope with margins.
2. **Terminal price versus probability density:** all 4,000 actual terminal observations, normalized by count and bin width. The finite view contains every observation and at least ±5 standard deviations (plus margin), including extreme samples. The analytic Gaussian now uses the correct axes. Histogram area is one and the readout states 4000/4000 counted.
3. **Terminal price versus payoff times density:** a separate dimensionless integrand, with finite-window shading and its actual analytic maximum included in the sampled path. Its **full-domain** area is the option value in price units. Density and weighted density never share an ordinate. The strike and complete peak glyph remain in view; tiny integrands can look flat on the stated finite plotting scale.

The previous integrand was clipped even at defaults: its maximum is about .17179 while the ordinate ended at .12. At sigma=.2,T=1,K=85 its maximum is about 29.9233 against an old maximum 2.2939, roughly thirteen times the view. Adaptive ranges now contain these cases, the high-volatility family and both strike extremes. When the actual integrand maximum is extremely small, its ordinate has a 1e−12 minimum plotting span to avoid floating-point transform overflow; this retains every actual value and is why an extremely small integrand can look flat. The numerical readout retains scientific notation instead of interpreting that flat appearance as a zero option value.

The stable formula uses put-call symmetry and the runtime's tail-accurate `erfc`: with `a=abs(100−K)/sd`, `C=max(100−K,0)+sd*(phi(a)−a*Q(a))`. A nonnegative numerical floor handles cancellation/underflow. The old erf-complement CDF produced negative option prices at 260 actual slider-grid settings, albeit tiny ones; for sigma=.2,T=6,K=104 it returned approximately −1.37e−17. The new formula and independent positive-payoff quadrature both give approximately **9.376e−18**. Tiny calls and analytic barrier probabilities use scientific notation. The scope explains extreme-tail finite-precision zero.

The numerical integral is independently evaluated without the CDF. For an out-of-the-money call, transform `z=a+u/(1+a)`, so it is `sd*phi(a)/(1+a)²` times the integral of `u*exp(−a*u/(1+a)−u²/(2*(1+a)²))` from zero to infinity. Simpson quadrature uses [0,40],1600 panels. The omitted tail is negligible at displayed precision. In-the-money quadrature directly integrates `(z−a)phi(z)` over `[max(a,−12),12]`. Tests compare this calculation with independent high-precision references, including far tails; observed relative discrepancies in the tested reference/control family are below 2e−8.

The third comparison is the actual 4,000-path payoff mean, with the **sample** standard error calculated by Welford's stable variance update. It is not presented as guaranteed agreement or an error bound. A zero estimated standard error can occur when no positive payoff was sampled, and that limit is public scope text. New-path clicks change the actual seeded sample, while sigma changes rescale the same independent Gaussian walks; both paths and controls remain synchronized.

## Independent references and verification

High-precision call reference values were generated independently with Python stdlib `decimal`, using 90-digit arithmetic and Laplace's continued fraction for the normal Mills ratio. This is different from the runtime's incomplete-gamma erfc calculation. Reproducible calculation:

```python
from decimal import Decimal as D, localcontext
with localcontext() as c:
    c.prec = 90
    pi = D('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534')
    for x in [0, 1, 4, 8, 15, 30, 37]:
        a = D(x)
        phi = (-a*a/2).exp() / (2*pi).sqrt()
        if x:
            den = a
            for n in range(4000, 0, -1):
                den = a + D(n)/den
            value = phi * (1-a/den)
        else:
            value = phi
        print(x, format(value, '.35g'))
```

Doubling to 8,000 terms changes the a=1 reference by about 1.36e−54 relatively and the a ≥ 4 results by zero at this Decimal precision. Unit-reference values include `C(0,8,1)=7.5502624119464989e−17`, `C(0,30,1)=1.6319567340914012e−199` and `C(0,37,1)=1.5451991905122025e−301`. The production formula agrees within 3e−9 relatively through these deep tails; the independent quadrature agrees within 2e−8. These are mathematical references, not historical observations.

- `node --test tests/verification-fin-bachelier.test.mjs`: **5 groups pass**. They cover the original k/heat mapping, density normalization/variance and PDE derivatives; high-precision tail references, independent quadrature, intrinsic/parity/peak identities; **all 135,420 actual sigma/time/strike grid settings** for finite nonnegative monotone call values plus independent delta/gamma identities; direct finite payoff/monitoring/standard-error accounting; exact enumerated random-walk reflection with the lattice endpoint correction and histogram normalization/counting with forced extreme observations. New default tests were copied from a passing temporary draft.
- `node scripts/check.mjs fin-5.13 --static`: **1 item, 0 errors, 0 warnings**.
- `node tests/verification-fin-bachelier.mjs`: **4 final groups pass**, light/dark at 1450/430 px. Each runs actual inputs at all 8 control corners, K=100 at both horizons, default/high-volatility/deep-ITM/deep-OTM and tiny positive-tail cases, plus the actual reseed button. Independent native accounting regenerates the Gaussian sample separately, verifies all 60 complete displayed paths, all 4000 histogram counts and area, every Gaussian/integrand point and the actual integrand maximum, actual Monte Carlo means/SEs/monitoring probabilities and live readout. Pixel-bound assertions cover every curve sample even at tiny ordinates; rectangle bounds, filled rings, all native text metrics and 2 px data-text halos, strict TeX, display overflow, blank stages, actual control values and runtime errors pass.

Final logs: `/tmp/atlas-fin-bachelier-{math,static,native}-final.log`. Final screenshots: `/tmp/atlas-fin-bachelier-{default,highvol,deepitm,deepotm,tail,newpaths}-{1450,430}-{light,dark}.png`. Inspected representative default1450/light, highvol430/dark, deepitm430/light and tail1450/dark images: correct axes/units, complete sample histogram and paths, separate uncut integrand maximum, scientific tiny option values, readable controls/legends/captions and correct barrier classification. Also inspected final tail430/dark, deepotm1450/light, newpaths430/light and default1450/dark screenshots after the scientific-probability readout refinement. Tiny positive analytic probabilities are distinguished from zero observed crossings; the deep-out-of-the-money finite-precision zero and new seeded sample are presented consistently. Narrow controls, all formulas, scientific ticks and captions remain legible. Exact byte comparisons preserve neighboring 5.11,5.12 and5.15 item bodies; root owns its separate concurrent5.14 change. Both source flag clearance and any parent integration remain outside this agent's edits.


Parent independent logs: `/tmp/atlas-root-fin-bachelier-{math,native}.log`; static shared check of5.1/5.13/5.14 passes0errors/0warnings in `/tmp/atlas-root-fin-efficiency-static.log`. The native script independently regenerates every plotted walk/sample, rather than trusting the model helper. Parent found no further scoped defects.
