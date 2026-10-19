# Pharmacology renal-clearance source audit

Resolved: **pharm-4.6**. Independent parent mathematical/native checks and screenshot inspection passed; source flag and central ledger are reconciled.

## Original primary source actually read

Cockcroft and Gault (1976), **Prediction of Creatinine Clearance from Serum Creatinine**, *Nephron* **16**:31–41, DOI **10.1159/000180580**, [original scanned paper](https://www.drugtnt.com/ref/RenalDosing/Cockcroft_1976.pdf). Read the complete original-paper text through its [hosted transcription](https://www.scribd.com/document/519107434/Cock-Croft-1976), including Methods, equation derivation, Results/Tables I–IV and Discussion. Acquired the complete 11-page scanned PDF, rendered and directly inspected original p33 (Table I and equation 3), p39 and p40 (female correction, steady state, muscle/body mass and assay limitations) against that transcription. This is the original study, not a current clinical recommendation or an independent external validation: the authors explicitly noted overlap between their derivation and test patients.

PDF `/tmp/atlas-pharm-cockcroft1976.pdf`, SHA-256 `8d38e2cdd177f2430662f58f1372949ec9224d77afeec0a0a14924c5fcbeb43f`; transcription HTML `/tmp/atlas-pharm-cockcroft1976.html`, SHA-256 `1b8605324c841224549391291be9c14cde5d0fa20f169ee3910722f39ac3cf72`. Inspected `/tmp/atlas-pharm-cockcroft1976-page{3,9,10}.png`.

The separate dose-rate relation follows independently from the chosen linear model. The unread Giusti–Hayton attribution and unsupported drug-selection claims are removed. Reference clearance, model parameters and the impairment-only cap are explicitly chosen assumptions.

## Corrections and evidence

The old implementation secretly floored estimated CrCl at 5 mL/min and kidney fraction at 0.04, and displayed an uncapped fraction while calculating with a cap. The historical equation now remains exact (the extreme is 3.935185 mL/min), with raw and explicitly capped model ratios both displayed. Periodic steady profiles now match their stated means; the old graph showed startup from zero while its prose discussed steady state. Explicit pre/post-dose vertices preserve jumps and exact peaks, including intervals longer than the displayed window. Both adjusted model means are reported, without a patient-specific imperative.

- `node --test tests/verification-pharm-renal.test.mjs`: **3 groups pass**. Independent derivation from daily creatinine excretion/unit conversion at all 16 age/weight/creatinine/sex corners; all 32 input/renal-fraction corners verify separate clearance components and both restored means; independent 3000-dose superposition, midpoint cycle integration, exact jump heights and the interval-over-96-hour case.
- `node tests/verification-pharm-renal.mjs`: **2 native light/dark groups pass**. Both actual historical factor buttons and all 16 slider corners per factor/theme; independently verify exact inputs, historical equation, model cap and restored means; all full periodic curves/jumps fit and no page/math/readout errors occur.
- Inspected full-size baseline/light and minimum-clearance/dark screenshots: `/tmp/atlas-pharm-renal-4.6-{0,1}-{0,13}-{light,dark}.png`.
