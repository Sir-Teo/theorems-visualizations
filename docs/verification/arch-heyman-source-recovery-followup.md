# Heyman1966: archived journal body recovered, source acceptance pending

A new public archive route supplies an actual43-page facsimile of Jacques Heyman's *The stone skeleton*, International Journal of Solids and Structures2(2),1966, printed249–279 with twelve interleaved plate pages, DOI10.1016/0020-7683(66)90018-7. This report checks retrieval provenance, document identity and page coverage only. It does not clear ARCH3.14's flag, accept its current claims/model, or claim that the complete argument has been independently read and audited.

The earlier live `electronicsandbooks.com` failures and the Reverte authorized Spanish preview's explicit missing5–6 were not repeated or bypassed. Worker One confirmed that the exact public archive-index route below had not been tried. The new exact CDX query returned one successful PDF capture, timestamp20250311135610. A normal request to that observed public capture returned200/application/pdf, without login, private credentials, publisher access-control circumvention or preview-limit workaround.

- [Public archived PDF](https://web.archive.org/web/20250311135610id_/https://www.electronicsandbooks.com/edt/manual/Magazine/I/International%20Journal%20of%20Solidstate%20Structures/IJSS_Papers/Vol.01-15/06071106595111108.pdf).
- Actual payload:2,136,404bytes, SHA256 `dce53c6e4b96f0068f72caed9842d6189635b841f06fde0844fa59dd6258e49a`.
- Independently computed SHA1/base32 `DXHWWKRKOTDS2SZANOUCTDXNJUQ7DBXI` exactly matches the public CDX digest, confirming that the downloaded bytes match that capture. The CDX's2,004,036length describes its stored archive record, not the decoded PDF payload size.
- PDF metadata title is `PII:0020-7683(66)90018-7`; first-page journal header, author, title and printed249 agree with the [actual publisher article record](https://www.sciencedirect.com/science/article/pii/0020768366900187). The final page is printed279, references15–39, received20July1965 and multilingual abstracts.

The publisher's pagination explicitly includes twelve plates. Their PDF-page map is:

| PDF pages | Journal material |
| --- | --- |
|1–8|printed249–256|
|9–12|four plates, publisher IN1–IN4; captions Figs1,4,5,8|
|13–20|printed257–264|
|21–28|eight plates, publisher IN5–IN12; captions Figs11,16,17,18,19/21,23,25,46|
|29–43|printed265–279|

The plate pages themselves use figure captions rather than printing the publisher's IN numbers. All43pages were rendered, their complete extracted text and image hashes inventoried, and the full contact sheet inspected for missing, blank, duplicated or obviously truncated pages. The first/final pages, both plate/text transitions and difficult-OCR page numbers261/267 were additionally inspected as full readable images. This is a complete-looking journal-body recovery with the expected31text pages plus12plate pages, rather than a title page, abstract or incomplete preview. It remains a public archived copy of a third-party mirror: the mirror's institutional affiliation and republication permission were not independently established.

Own evidence is `/tmp/atlas-worker-two/heyman-original-recovery/`: `heyman1966-archived-original.pdf`, full extracted `.txt`, `archived-original-provenance.json`, exact CDX response/provenance, `page-inventory.json`, `all43pages-contact-sheet.png`, and all43page PNGs/text files in `pages/`. The bounded machine-readable summary is committed as `arch-heyman-recovery-provenance.json` alongside this report. No binary source is added to the repository.

The later1995 Cambridge book with the same main title is a different work, as its actual publisher frontmatter explains; it is not substituted for this1966article. No additional preview sessions or user-upload download routes were used. The continuation coordinator should read and compare the recovered actual article within an explicit claim scope, then perform the independent mathematical/model/native audit before any source-flag decision. No production, shared-runtime or global-ledger files changed in this recovery step.
