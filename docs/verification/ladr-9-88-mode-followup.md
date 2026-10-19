# LADR 9.88 alternate-mode follow-up

The reported blank `mode1:canvas0` / `mode2:canvas0` states were an unused raster layer, not missing mathematical content. In GHZ and W modes, the left stage deliberately replaces draggable vector bars with KaTeX overlay equations and an explanation that no three vectors produce the displayed tensor. The right stage still renders the tensor and flattening ranks. Actual native screenshots in both themes confirmed all of this content was visible and readable; the stage was neither offscreen nor paused.

The local source now explicitly sets only the left canvas's `visibility` to `hidden` in these two modes and restores `visible` for the simple-tensor mode. The overlay and the stage dimensions remain intact. This represents the presentation state to the existing hidden-canvas-aware checker. No common runtime, harness, checker, formula, or unrelated card changed.

Verification used the real pinned KaTeX 0.16.11 through `installBrowserAssets`, native segmented buttons, and the sequence simple → GHZ → simple → W → GHZ → simple in both themes (12 checked states). Every state had an empty visible-canvas blank list and no page, visualization, or TeX errors. The left canvas restored each time; its 385×330 panel and the right 459×330 panel retained their dimensions. Both tensor ranks and evaluations remained correct: simple (1,1,1), GHZ/W (2,2,2), GHZ evaluation −0.248, W evaluation 0.634. All six distinct theme/mode screenshots were manually inspected, including restored vector bars.

Commands:

```sh
node --check content/ladr/ch09-h.js
node scripts/check.mjs ladr-9.88 --static
node /tmp/atlas-ladr-9-88/native.mjs
```

Static result: one item, zero errors and zero warnings. Focused native results and screenshots: `/tmp/atlas-ladr-9-88/results.json`, `{light,dark}-{prod,ghz,w}.png`. The pre-change evidence is retained in `/tmp/atlas-ladr-9-88/before.json`; its alternate states reported canvas 0 while showing readable overlays.
