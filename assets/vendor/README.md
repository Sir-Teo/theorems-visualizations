# Local browser dependencies

These files are served directly by both `index.html` and `tools/harness.html`.
No package installation, CDN connection or external font service is needed at runtime.

- **KaTeX 0.16.11:** `katex-0.16.11/katex.min.js`, its stylesheet and every referenced
  WOFF2/WOFF/TTF file come from the official npm tarball for that exact version.
  The tarball's SHA-512 integrity was verified against npm's release metadata before
  copying. The upstream MIT license is in `katex-0.16.11/LICENSE`. File lengths and
  SHA-256 hashes, source URL and tarball integrity are in `provenance.json`.
- **Inter, Newsreader and JetBrains Mono:** `google-fonts/fonts.css` preserves the
  existing Google Fonts API response's family, weight, style, optical-size and Unicode
  subset definitions, with only font URLs rewritten locally. All 19 distinct referenced
  WOFF2 files are included. `google-fonts/provenance.json` records the exact request,
  upstream/local CSS hashes, versioned Google font URLs, file hashes and the pinned
  Google Fonts repository commits for the three OFL licenses. Trailing whitespace was
  removed from two license files; their original and local hashes are both recorded.

Do not edit the font binaries or minified KaTeX files. For an intentional dependency
update, obtain the intended upstream release, preserve its licenses, regenerate the
provenance and run `node --test tests/local-assets.test.mjs` plus
`node tests/local-assets.mjs`. The native test blocks all external requests and exercises
real app, proof, bridge and harness pages in both themes.
