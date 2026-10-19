# Celestial navigation at the horizon

`geog-2.4` declared Polaris invisible everywhere south of the equator;
its diagram and readout used hemisphere checks despite calculating the
star's actual geometric altitude. With the widget's polar distance .66°,
at latitude −.3° Polaris reaches +.36° at upper culmination and −.96°
at lower culmination. At latitude +.3° it can also set.

Visibility now follows positive geometric altitude. The near-equatorial
southern circle is permitted, the north celestial pole has the correct
signed altitude below the northern horizon, and below-horizon Polaris
states are labelled unavailable. Polar-night Sun altitudes no longer
produce a purported usable observation. The cross-section arrow identifies
the celestial pole rather than Polaris, with its label kept inside the
stage at high northern latitude.

The statement and scope distinguish geometric from practical visibility,
exclude refraction/dip/terrain, identify .66° as a fixed illustrative
2018 value, and qualify the first-order Polaris correction. The exaggerated
daily circle is schematic; readouts and visibility use unexaggerated
altitudes. The original spherical altitude formula is unchanged.

Two actual-widget regressions check southern rise/set, northern setting,
complete southern invisibility, and rejection of a polar-night noon-Sun
observation. Six existing geography math groups pass. All 24 native states
passed runtime/TeX checks and captures were inspected in both themes:
default, correction off, real circle, southern rise and corrected rise,
southern/northern setting, southern hidden, northern winter/summer,
near-zenith Sun and southern winter.

Artifacts: `/tmp/agent-review/navigation-browser.{mjs,json}`, named PNGs
and `navigation-geog-tests.log`. Strict build, full regressions, review
hashes and packets are checked before commit. No original-source flag,
human-review or subjective-listening credit is claimed.
