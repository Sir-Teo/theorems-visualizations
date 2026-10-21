# Physiology oedema-compartment source audit

Resolved: **physio-4.13**. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Source support and its limits

Reread Starling (1896), [On the Absorption of Fluids from the Connective Tissue Spaces](https://pmc.ncbi.nlm.nih.gov/articles/PMC1512609/), original pp. **321–325**, especially the pressure/protein argument and explicit lymphatic qualification on p.325 (also directly inspected in the4.20 audit). This supports the historical physical reasoning; it does **not** validate the chosen later tissue pressure, protein dilution, reflection coefficient or lymph-flow functions. The entry now makes that distinction explicit and labels every numerical parameter illustrative. The unsupported clinical disease list, visible-oedema pressure test and17mmHg safety-factor claim have been removed. No current clinical prediction is made.

Source HTML/scans and hashes are recorded in `physio-source-audit-starling-followup.md`; original p.325 is `/tmp/atlas-physio-starling1896-325.png`.

## Model correction

The old claim that curves stop crossing and predict unbounded growth was false for the actual equations: the chosen tissue pressure rises without bound, so the strictly decreasing net flux always crosses zero. A15L search cutoff misclassified distant intersections, and the time plot separately clipped volume at15L. Root bracketing now expands to the true finite equilibrium, and a1-minute RK4 trajectory shows the full24hours. At the most extreme controls the model extrapolates to **129.41L equilibrium and123.33L after24hours**; these mathematical values remain visible and are explicitly not clinical volume predictions, since plasma depletion and replacement are absent.

## Validation

- `node --test tests/verification-physio-source-audit-oedema.test.mjs`: **3 groups pass**. Constitutive continuity and independent baseline balance; strict net-flux decrease across16 corners×1000 volume increments; all16 finite stable roots, independent quadratic solution with zero lymph; full trajectories remain monotone below equilibrium; RK4 step halving and independent half-minute explicit integration verify units and time evolution.
- `node tests/verification-physio-source-audit-oedema.mjs`: **2 native light/dark groups pass**. All16 actual pressure/oncotic/lymph/reflection corners, independently evaluated equilibrium balance, a true uncapped trajectory beyond15L, complete curves and marker-radius containment, finite readouts and no page/math errors.
- Inspected full-size extreme/dark and low/light screenshots: `/tmp/atlas-physio-oedema-4.13-{low,high,extreme}-{light,dark}.png`.
