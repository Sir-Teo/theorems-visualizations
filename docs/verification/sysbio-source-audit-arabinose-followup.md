# Systems biology: arabinose sign-sensitive delay

Ready for root integration: **sysbio-3.4** (`content/sysbio/ch03.js`). Its source flag is retained pending coordinated ledger integration.

## Primary source read

S. Mangan, A. Zaslaver and U. Alon, “The coherent feedforward loop serves as a sign-sensitive delay element in transcription networks”, J. Mol. Biol. 334 (2003), 197–204, DOI [10.1016/j.jmb.2003.09.049](https://doi.org/10.1016/j.jmb.2003.09.049). Full original eight-page PDF acquired from [academic course mirror](https://marcottelab.org/users/CH391L/Handouts/CoherentFFL.pdf), cached `/tmp/atlas-sysbio-mangan2003-arabinose.pdf` and `.txt`. SHA256 `993a6d2414e41941c6ae4a1d7911c51254f63144acf3083236a507d2db7ddca8`. Printed page = PDF page +196. All eight pages read; original Table2/Figure4 rendered and inspected (`/tmp/atlas-sysbio-arabinose-table2.png`).

Precise anchors: p198 Figure1 and circuit description establish CRP→AraC and CRP/AraC→araBAD/araFGH and the lac comparison; p199/Table1 establishes induction conditions; p200 Table2 and Figure4 distinguish additional ON delay from the lack of comparable additional OFF delay; pp202–203 Methods distinguish GFP fluorescence, inferred promoter activity, and the saturating arabinose/IPTG kinetics protocol. Addition of cAMP induces the studied response; addition of glucose suppresses cAMP. The experimental lacZYA reference includes LacI with IPTG, rather than being a native CRP-only promoter.

## Corrections

The statement now identifies the wiring, intervention, reporter comparison, and experimental limitations against the full original. The source measured reporter behavior in this experimental context; it does not establish a universally ideal AND gate. The direct-reference reporter in the visualization is explicitly a chosen atlas model, and plotted concentration is distinguished from experimentally inferred promoter activity.

The chosen Hill model is not the source data. Exact regulator relaxation and an independently validated RK4 reporter integration replace the prior Euler trajectories. Sharp-threshold production onset and finite-Hill reporter half-rise are separate quantities. When K exceeds the available activity-scaled regulator, sharp onset is unattainable but the graded Hill reporter is positive. Each half-response now uses its own exact ON steady level; low-amplitude traces no longer produce an undefined fixed-0.5 response. After OFF, production stops immediately while accumulated reporter decays with half-time ln2/4 in chosen model units. The regulator control is accurately labeled a removal rate, and threshold lines are shown only when attainable.

## Validation

`node --test tests/verification-sysbio-source-audit-arabinose.test.mjs`: **5 groups passed**: every parameter corner and independent steady formula/physical bounds; exact regulator/direct-reference both directions; analytic OFF decay and interpolated half-time (sampling tolerance, not claimed exact equality); independent 10,000-panel Simpson convolution of the linear reporter ODE; unattainable sharp threshold with positive graded output, onset/half-rise distinction and step refinement.

`node tests/verification-sysbio-source-audit-arabinose.mjs`: **2 browser groups passed** (light/dark). Actual range controls exercise all eight removal/activity/threshold corners, including Home/End for the logarithmic slider; every plotted channel in both panels is checked, as are half-time readouts and low-output scope. No NaN or false never-on label. Screenshots personally inspected:

- `/tmp/atlas-sysbio-arabinose-positive-below-sharp-threshold-light.png`
- `/tmp/atlas-sysbio-arabinose-onset-versus-half-response-dark.png`

Companion opposite-theme screenshots are retained. No original numerical dataset fitting, broad theorem guarantee or Wave5 advancement is asserted. Central ledgers and package files were not edited.
