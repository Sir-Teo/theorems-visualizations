# XTAL cell and stabilizer qualifications

Separate bounded successor to prerequisite `c08ce47f98934df38f31ece002417f9cb6ff2fb5`, pending independent review. Exactly two existing proof substrings change:3.3 now compares two primitive cells when asserting determinant ±1;3.8 no longer says every axis site stabilizer is cyclic, and qualifies the isolated-mirror example. Every other XTAL source byte, numerical function, dependency and flag remains unchanged under the explicit literal guard.

An index-two supercell is smaller than an index-four conventional cell without being primitive. The actual4mm point group fixes a generic point on its directed z-axis with eight operations including mirrors; every operation has fourth power identity, so this order-eight group is not cyclic. These independent counterexamples and21 unimodular shears pass `verification-xtal-qualifications.mjs`. The full orbit/stabilizer formula and all models remain unchanged.

Fresh actual320px light/dark3.3/3.8 statement/proof runs pass, including sixteen raw/main pictures. I personally inspected all four changed actual proof images. Strict build has zero errors and warnings. Evidence `/tmp/atlas-new-imaging-source/xtal/qualifications/{native.json,*.png}` and `qualification-{build,native}.log`. The separate inherited equation overflows remain for the next equivalent-wrap boundary. No source closure.
