# CPLX final equivalent layouts and producer gates

Required third producer boundary after prerequisite-only `e2a5b01870439c48510d7a73cec7f8af3e5b89f5` and qualification `3e895f0b`. No new dependencies, proof claims, functions, models, helpers, flags or syllabus changes occur in this boundary. `tests/cplx-wrap-manifest.json` records three complete statement exceptions.

1.3 and 1.11 use two short lines inside gathered display equations, with paragraph boundaries around the displays. Their complete ordered non-layout tokens equal the previous statements; the explicit combined audit verifies this. The long English predicate in 4.6’s set-builder definition is moved into ordinary prose: HALT₁ consists of 1ⁿ exactly when the nth machine halts on empty input. This is the same language, and every subsequent statement word is exact. It avoids an unbreakable text fragment inside TeX. The combined audit verifies the complete literal transformation.

The initial fresh production audit found inherited clipping in precisely those three statements. Personal inspection of the first passing bounds run then found a display/prose seam in 1.3/1.11. Literal-safe reconstruction restored the double-dollar display delimiters and added paragraph boundaries. The final four complete statement screenshots in `closing-display-pixels` were personally inspected in light/dark and display clearly. No shared renderer fix was made.

Final evidence:

- Explicit combined guard reconstructs all thirteen prerequisite additions, four no-credit row backfills, four qualification fields and these three layout fields from the original archive. All **53 objects, 53 functions, flags, helpers/collection/chapter metadata, 158 syllabus rows and all 53 full raw written/syllabus lists** pass. All other source bytes remain exact. The guard also verifies ordered equivalent tokens for both gathered equations and the exact equivalent HALT₁ definition rewrite.
- Independent prerequisite math passes **12 groups / 3,365,600 assertions**; separate qualification witnesses pass **578 assertions**. Existing CPLX circuit suite passes all **15** tests. No production helpers are imported into the new math witnesses.
- Final strict build: **0 errors / 0 warnings**, home **112,771 bytes gzip**. Final static CPLX: **53 / 0 / 0**. Direct authoritative inventory import confirms **16 written / 18 known / 25 whole**, unknown dependencies zero. No global inventory is rewritten.
- Fresh native audit: **22 mounts**, viewport **320px**, light/dark, no page errors, TeX errors or blank canvases. Complete actual built production statements/proofs and the one existing scope comprise **46 fields**, including actual statement inner width **253px**. An additional **22 complete source-rich proofs** are rendered at exactly **253px** in the native harness. All **68** captures passed actual text-Range, display scroll, container scroll and TeX-error checks. The source-rich proof width is explicitly a controlled harness check; it is not represented as the production proof width.
- I personally read all **68 complete screenshots** (full-height, not clipped viewport captures) in light/dark. After the final literal display correction, a fresh **four-mount / twelve-field** closing run passed; I inspected all four changed full statements. The four closing 1.3 proof captures are byte-identical to their previously inspected captures (`closing-provenance.json`); the four 1.11 proof captures differ in rasterization after the statement layout changed, and I personally inspected all four fresh complete proofs again. Both complete scope pixels and all long 2.13/3.2 proof endings are included.

Reproduce from the final archive after strict build:

```
node tests/verification-cplx-followups.mjs <original baseline archive> <final archive> <own guard output>
node tests/verification-cplx-prerequisites-math.mjs
node tests/verification-cplx-qualifications-math.mjs
CPLX_FINAL_OUTPUT=<own pixels> node tests/verification-cplx-final-native.mjs
```

The original baseline is the CPLX content in `eea07c0f6fcccfd06ddd71392b19cab7afca72e9`, identical to accepted root `3706218`; the temporary archive is `/tmp/atlas-cplx-prereqs-evidence/baseline`. Evidence logs, reading extracts, guards, full raw lists, 68 full pixels/contact sheets and closing captures are under `/tmp/atlas-cplx-prereqs-evidence`. The earlier provisional qualification hash `7855c9b1` was replaced before final handoff after strict build caught a literal-replacement error; **only `3e895f0b` is required**. Initial native failures and the literal correction are retained as honest provenance.

No existing bridge references CPLX. No global ledger, source closure, runtime behavior, helper or flag changes are claimed. Producer gates are complete; rotated independent acceptance remains required. The published prerequisite target is **not** claimed complete: nine more genuine written inputs would still be needed.
