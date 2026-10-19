# Local math and typeface assets

2026-10-19. Removes an external-resource startup blocker without changing the pinned
KaTeX version or the site's typefaces.

## Reproduction and fix

The parent reproduced a page-load timeout with pending jsDelivr KaTeX CSS/JS before
the application existed. After replacing KaTeX with local 0.16.11 assets, a separate
native diagnostic held only the Google Fonts stylesheet response. Navigation again
timed out after four seconds with `document.readyState === 'loading'`, before the body
or app was parsed. Both blocking dependencies are therefore served locally.

`index.html` and `tools/harness.html` use the local KaTeX stylesheet/runtime and the
same local typeface stylesheet. The harness receives the full site font inventory,
including its prior subset. External font preconnects are removed.

KaTeX's [official browser installation documentation](https://katex.org/docs/browser.html)
describes serving its distribution and sibling font directory locally. This copy comes
from [the official pinned npm release metadata](https://registry.npmjs.org/katex/0.16.11)
and its tarball, verified against the metadata's SHA-512 integrity before extraction.
It includes unchanged minified JS/CSS, all 60 referenced WOFF2/WOFF/TTF files and the
upstream MIT license. Per-file hashes and tarball provenance are recorded locally.

The existing Google Fonts request supplied 48 font-face definitions using 19 distinct
WOFF2 files. The local copy preserves every definition and Unicode subset, Inter
normal 400/500/600, Newsreader normal 400/500/600 and italic 400/500 with optical sizing,
and JetBrains Mono normal 400/500. Only font URLs in the CSS change. Each font binary
is unchanged. SIL OFL 1.1 licenses include their author notices and pinned source
commits. Two license files have trailing whitespace removed, recorded with original
and local hashes. Full details are in the two vendor provenance manifests.

## Validation

Three asset-inventory groups pass:

- Every KaTeX asset matches its versioned manifest hash; all CSS font references exist.
- All Google fonts and licenses match their hashes, the face inventory matches the
  existing styles/weights, and reversing only the local URL substitutions reconstructs
  the exact upstream CSS hash.
- All HTML entrypoints use local runtime styles/scripts, with no CDN or external
  font stylesheet links.

Eight native cases pass: home, actual `ladr-2.30` proof, Fourier bridge and the real
item harness, each in light/dark themes. The browser intercepts every request and blocks
all non-local origins; no external request is even attempted. All ten family/style/weight
combinations explicitly load, including sample Latin, Greek, Cyrillic and Vietnamese
glyphs. Math renders with KaTeX 0.16.11, first/next/last proof controls and bridge controls
work, every requested font loads locally, and there are no failed requests, runtime or
typesetting errors. Font readiness is awaited normally; no load timeout or readiness
condition was relaxed.

The six existing UI regressions also pass. All eight native screenshots were inspected:
home typography, proof math/pseudocode and vector labels, bridge plots/controls, and
harness statement/explanation remain legible with the expected typefaces in both themes.

```sh
node --test tests/local-assets.test.mjs
node tests/local-assets.mjs
node --test tests/ui.test.mjs
git diff --check
```

Native evidence: `/tmp/atlas-local-assets-native.json` and
`/tmp/atlas-local-assets-{home,proof,bridge,harness}-{light,dark}.png`.

This provides local static assets for network-independent startup once the site is
served or downloaded. It does not add a service worker or promise that an unvisited
deployed page is cached for an entirely disconnected browser.

## Files

`index.html`, `tools/harness.html`, `assets/vendor/`, `tests/local-assets.test.mjs`,
`tests/local-assets.mjs` and this report. No content flags, central ledger, master plan,
package dependency or runtime initialization changes are included.
