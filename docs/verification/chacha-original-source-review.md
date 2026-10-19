# ChaCha original and RC4 scope follow-up

Read Bernstein's complete six-page *ChaCha, a variant of Salsa20*, dated
28 January 2008. The author's PDF returned HTTP 502 in this pass; the
[SwissBay copy](https://theswissbay.ch/pdf/Crypto/ChaCha%2C%20a%20variant%20of%20Salsa20%20-%20Daniel%20J.%20Bernstein.pdf)
contains the dated original, permanent ID `4027b5256e17b9796842e6d0f68b0b5e`.
All six pages were read as extracted text; pages 1, 3 and 5 were also
visually inspected for the date, quarter round and matrix/schedule.
Downloaded PDF: `/tmp/chacha2008-swiss.pdf`, 111,295 bytes, SHA-256
`654280755b604667419f24d72047e3729655481d2569694125930070f87187f7`.

Sections 1–3 support the 8/12/20-round family, four additions/XORs/rotations
per quarter round, rotation distances 16/12/8/7, alternating column/diagonal
schedule and final input-state addition. The diffusion discussion is a
heuristic, not a proof of security. The benchmark table was read but is
not used as validation of current hardware performance.

Re-read RFC 8439 §§2.3–2.4 from the RFC Editor text, in addition to the
previously checked quarter-round and block vectors. The RFC explicitly
distinguishes the IETF 32-bit counter/96-bit nonce from the original
64/64 split. Its initial counter need not always be one. The original
paper alone was not used to infer that split.

## Corrections

`crypto-4.2` now cites the original and RFC, verifies Bernstein's exact
date, and removes optional unverified historical dates and a broad
absence-of-known-bias claim. Its scope matches the actual experiment:
random 16-byte RC4 keys; 256-bit IETF ChaCha keys; a fixed nonce; sampled
counters `1+16k`, `0<=k<2^16`; diffusion measured before final input
addition after flipping one of the four lowest counter bits. The previous
fixed-counter description was false.

The RC4 explanatory condition concerns the initial PRGA state and the
**second** byte. Its probability under a uniform permutation is
`(1/256)(254/255)`; that is not a statement that RC4's key schedule is
uniform. The readout identifies its actual illustrative `4 sqrt(N/256)`
threshold, and staying below that threshold is not labelled a proof of
indistinguishability. The caption now says 512 state bits. Cipher helpers,
random generation and sampled values are unchanged.

## Remaining original-evidence gap

The combined flag stays open for the full Mantin–Shamir 2001 original
and its exact key-schedule/distribution assumptions. The source ledger
now names that remaining gap; Bernstein is no longer listed as missing.
This is a partial source resolution, with **no decrease** to the 233-page
open-flag count.

Bounded attempts in this pass: the author's ChaCha January PDF returned
502 and the February filename 404; two alternate author-cache routes
returned 403. Both flat and nested IACR FSE 2001 PDF routes returned 403;
the UConn RC4 copy timed out over HTTP and returned 503 over HTTPS; the
attempted Weizmann author PostScript path returned 404. These observations
do not establish that the original is unavailable elsewhere.

## Validation

- The existing computing verification suite passes all 26 test groups,
  including independent RFC quarter-round/block known-answer vectors.
- Native light/dark mode checks pass without runtime, TeX, blank-stage or
  quality warnings. All eight generated mode captures were inspected.
- An additional native driver exercises both ciphers at all three sample
  counts in both themes (12 captures, all inspected), four round-slider
  endpoints, and two resamples. Counts/readouts agree, resampling changes
  the result, and all checked values are finite. Artifacts:
  `/tmp/agent-review/chacha-browser.{mjs,json}`.
- The source queue, source evidence, strict build, review packets and
  current review hashes are regenerated/checked with this change.

These are agent findings; they grant no human or listening review credit.
