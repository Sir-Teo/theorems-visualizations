# Original atlas physical-anchor causal probe

20 October 2026. New bounded authorized phase probe after preserved negative-output boundary `6c45d07947c2074660cb0b9a0e01b3a42bc524b8`. No renderer repair or full-map rerun at this boundary. Eight original-only cases use physical anchor fractions `{.125,.625}²`, original word `i`, original native fonts/Canvas/LINEAR/shaders, and actual texture-FBO/upload/draw readbacks. All inner glyph bytes match fresh/repacked exactly; original fresh gutters are zero.

| Style / physical fractions | low/low | low/high | high/low | high/high |
| --- | ---: | ---: | ---: | ---: |
| 32px serif, DPR1; changed RGBA channels | 0 | 16 | 56 | 76 |
| maximum channel difference | 0 | 92 | 96 | 96 |
| chapter: 60011px Inter, top/left/0px spacing, DPR2, rgba(71,115,207,.5), phase0; changed channels | 0 | 0 | 24 | 23 |
| maximum channel difference | 0 | 0 | 48 | 48 |

The chapter style is exactly `600 11px Inter`; the compact table typography does not mean a 60011px font. Both low/low negative controls are retained. Repacked gutters have17 nonzero texels in the serif cases and5 in the chapter cases. For an inner physical edge ending at fraction`.625`, the final covered pixel center at`.5` lies`.125` inside that edge; LINEAR sampling blends the next gutter texel with weight`.375`. At fraction`.125`, the final covered center is`.625` inside, beyond the half-texel blend footprint, so no gutter contribution is expected. Actual word bounds/physical boxes and exact border texels are recorded. A high fraction permits a gutter contribution; it does not require one when those particular border texels are transparent, explaining the chapter low/high zero. This source-grounded phase prediction was stated before execution.

The positive native output witness now exists with unchanged inner glyph bytes and actual dirty GPU borders, including the chapter style. This authorizes only the already scoped conditional private transparent-gutter intervention and tiny matrix, not a conclusion about full-map equivalence, performance or the exact earlier full-map cause. All original files/shared runtime/prior failures remain unchanged.

Run `node tests/map-text-atlas-phase-causal.mjs`; raw `/tmp/atlas-map-atlas-phase`, committed `map-text-atlas-phase-causal.json`. Every case retains lossless native fresh/repacked PNGs and exact draw/atlas RGBA files with SHA256s, plus original upload rectangles, native packing/filter/word/GL/resource/browser state. Diagnostic FBO/readback/base64 allocations are separate from original logical owners; no physical64MB claim. Each original painter/atlas is destroyed with budget0, scratch removed, diagnostic FBO deleted, and GL context explicitly lost after capture. Browser and private server close in finally. No time or FPS measurements.
