# RCA 14.10 legend correction

A root screenshot spot-check found that the fixed red legend said “omitted set” even in the non-univalent `z+z²` mode, where the red dots mark the critical point −1/2 and its image −1/4. That image value belongs to f(U). The caption now distinguishes the critical-point example, and the legend distinguishes omitted-region boundaries, omitted rays and the critical point/image. The mathematical map and coefficient computations are unchanged.

Focused static validation passes with zero errors/warnings. Actual native clicks through all five choices in both themes verify the corresponding legend, real KaTeX 0.16.11, nonblank canvases and no page/TeX errors. The non-univalent dark screenshot was inspected after correction; the caption, dots and legend agree. Evidence is `/tmp/atlas-rca-legend.json` and `/tmp/atlas-rca-legend-{theme}-{choice}.png`.

The collection-level source fingerprint invalidates earlier RCA captures, including unchanged items. They must be refreshed before the final current-input browser gate can pass. No source flag changed.
