# Physiology Harvey-paper source audit

Resolved: **physio-4.19**. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Primary text actually read

Harvey, *De Motu Cordis* (1628), Robert Willis's1847 translation reprinted in the1906 J.M.Dent edition, [Project Gutenberg67065](https://www.gutenberg.org/ebooks/67065). Read complete **ChaptersVIII–IX andXIII**, including the assumptions in the amount-per-beat argument, all four numerical examples, the sheep observation, the explicit deferral of precise stroke-volume determination, and the directions of the finger/valve/refilling experiment. The translation and edition were checked against the file's title metadata and its note identifying the1847 reprint. Also cross-checked the complete [ChapterIX transcription](https://en.wikisource.org/wiki/The_Works_of_William_Harvey/An_Anatomical_Disquisition_on_the_Motion_of_the_Heart_and_Blood_in_Animals/Chapter_9).

This is direct reading of a primary work in an identified historical translation. It does not independently check the Latin or resolve historical mass-to-volume metrology. The entry now says exactly that, removes the false suggestion that Harvey measured a universal modern stroke volume, and avoids claiming that matching a modern reference validates his quantitative accuracy. Unsupported priority rhetoric and the uninspected Malpighi date were removed. The chosen modern70mL/75min−1/5L reference and3.7mL/drachm convention are labelled choices, not empirical data or verified1628 units.

Local complete text `/tmp/atlas-physio-harvey1628.txt`, SHA-256 `5a8e106fca43a0a052b30c69a22d6b1f27d51f73c8ecc30182b36a49465ab4f2`.

## Model and visual corrections

Adaptive cumulative-weight bounds show the full **104.17lb** extreme instead of clipping at14lb. The logarithmic bar panel now includes the **0.925mL** lower endpoint; decimal labels avoid rounding it into an apparently zero value. During reverse pressing the finger stops above the closed valve, and the below-valve segment stays empty while the above-valve segment remains filled, matching the text. Release removes the lower-finger marker and refills from hand toward heart. This remains an explicit directional cartoon, not a fluid solver or original plate.

## Validation

- `node --test tests/verification-physio-source-audit-harvey.test.mjs`: **3 groups pass**. Independently reconstructs all four ChapterIX arithmetic examples:1000drachms =10lb5oz,2000=20lb10oz,4000=41lb8oz,8000=83lb4oz; all16 capacity/ejection/beat/body corners verify throughput, crossing time and the explicitly chosen volume conversion;101 finger positions check reverse-valve blockage and refilling direction.
- `node tests/verification-physio-source-audit-harvey.mjs`: **2 native light/dark groups pass**. All32 true five-slider corners×all4 actual vein-step buttons per theme, independent arithmetic/valve checks, entire cumulative curves and logarithmic bar rectangles/markers within bounds, finite readouts and no page/math errors.
- Inspected full-size low/light and high/dark screenshots: `/tmp/atlas-physio-harvey-4.19-{low,high}-{light,dark}.png`.
