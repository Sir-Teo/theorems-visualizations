# Wilson-cycle heuristic and exact two-flank model

Reviewed **geol-3.12**, a generic Model, against the original modern heuristic development by Whitmeyer, Fichter & Pyle2007 and an independent derivation of the atlas construction. No original Wilson1966 historical-paper review is claimed.

## Primary source and reading boundary

[Whitmeyer, Fichter & Pyle, New directions in Wilson Cycle concepts, Geosphere3(2007),511–526](https://csmgeo.csm.jmu.edu/geollab/sst/NewDirectionsWilsonCycle-i1553-040X-3-6-511.pdf), DOI10.1130/GES00091.1. Read introduction/background pp511–515, complete modern-depiction/supercontinent discussion pp516–519, and complete Modern Heuristic Wilson Cycle development p519 with Fig5/caption pp520–521. Both original figure pages rendered/inspected. Later educational evaluation and every cited reconstruction are outside this review. This original author development presents a modern heuristic with accretion/multiple collisions and expressly identifies geometrical simplifications, rather than a universal clock.

Cache `/tmp/atlas-geol-sources/whitmeyer2007.pdf/.txt`; SHA256 `2061412b7d2f01e3b7384b2b24eecfa8c0a2bae84a22e12daf1890ee72ea79a1`; inspected `whitmeyer-fig5-10.png` and `-11.png`. Original Wilson1966 university scan returned404 and public archive index had no match; original maps/priority are not asserted. The separate named McKenzie–Parker Paper remains pending.

## Independent construction and repairs

With full spreading u, removal c and start Ts, a=b=ut/2 before Ts. While the ridge survives, a=ut/2 and b=uTs/2+(u/2−c)(t−Ts). Finite ridge arrival exists exactly when c>u/2, at tr=2cTs/(2c−u). Then a=u tr/2−c(t−tr),b=0 until collision tc=tr(1+u/(2c)); widths stay zero thereafter. These km/Myr equations follow from the declared one-dimensional rules, not a calibrated geological law in the source.

Replaced yearly stepping that discarded event overshoot and misdated collision. Exact events enter the graph. For u/2<c<u the basin initially widens with active subduction, then closes after ridge loss: comparing c with full u alone did not justify an ever-open claim. Removed global area/mass conservation and automatic rerifting/repetition claims that this local model cannot establish. Named modern basins are no longer claimed as literal reconstructions.

Dynamic bounds contain the55000km formal flat-model extrapolation and full graph; this is not a physically literal basin on a spherical Earth. Floor ages follow formation/transport: oldest surviving western floor continues aging after ridge loss, instead of decreasing with width; complete loss gives none. Added actual time scrubbing and one-shot play/restart. Final margins contain the trench label and separate state/mountain text. Vertical cartoon exaggeration and fixed continent widths are explicit.

## Validation

`node --test tests/verification-geol-wilson.test.mjs`: **5 groups pass**. Independent event-root elimination/continuity;1296 slope/source-sink-budget states; widening-then-closing and constant-width cases; exact event inclusion and peaks versus10001time samples per corner; independent floor birth-time accounting.

`node tests/verification-geol-wilson.mjs`: **2 native theme groups pass**, all8actual rate/start corners ×2time endpoints, actual play/pause/restart/scrub and replay from terminal frame. Actual paths/dots/rectangles/polygons are finite/contained; never/no-floor outputs are explicit. An initial duplicate test-instrumentation variable was repaired; production rendered correctly. Full run repeated after final label margins; `/tmp/atlas-geol-wilson-native-final.log`. Personally inspected final wide-open/light and collision/dark images. Wave5 remains gated.
