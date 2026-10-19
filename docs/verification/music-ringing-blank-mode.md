# Music 8.21: invalid-notation mode follow-up

The full-mode sweep found a blank canvas after changing the default four-bell Plain Bob Minimus example to five bells. The current notation, `x14x14x14x12`, contains an `x` change that cannot pair the fifth place on five bells. The parser correctly returns its unmatched-place diagnostic. The renderer previously returned immediately, leaving the automatically cleared, axes-free stage empty.

The item-local renderer now displays an invalid-notation panel explaining that every unfixed place needs an adjacent swap partner and inviting the reader to choose a matching method or edit the notation. The exact parser diagnostic remains in the readout. No changes were made to parsing, row generation, source flags, mathematical claims, shared runtime, or checker. A valid custom notation or method selection restores the bell paths.

Validation on 2026-10-19:

- `node --test tests/verification-music.test.mjs` passed, including a regression that rejects the actual five-bell/default-notation combination, checks explanatory canvas text, and recovers five paths and ten changes with valid five-bell notation. Existing independent preset counts remain eight, twenty-four, ten and twelve changes.
- `node tests/verification-music-ringing-browser.mjs` passed **26 settled native-input states per theme**, serially, with actual local KaTeX 0.16.11. It clicks all bell-count buttons, all four method presets and custom mode, all followed-bell buttons, and uses keyboard Home/End on the row slider for every preset. It also types empty and out-of-range notation, then repairs it with valid six-bell notation and restores Plain Bob Minimus. Every checked state has no blank canvas, runtime error, TeX error, or nonfinite readout.
- `node scripts/check.mjs music-8.21 --static --fail-on-warnings`: one item, zero errors and zero warnings.

Native evidence: `/tmp/atlas-music-ringing/native-controls.json`. Screenshots in the same directory: `music-8.21-{light,dark}-{invalid,valid}.png`. All four screenshots were manually inspected: the invalid state presents a readable, centered explanation; the repaired state restores bell paths and the twenty-four-row extent readout in both themes. No full collection sweep was run.

Only `content/music/ch08-c.js` changes the MUSIC collection fingerprint. The collection is frozen after this focused fix for the parent verifier to refresh its final evidence.
