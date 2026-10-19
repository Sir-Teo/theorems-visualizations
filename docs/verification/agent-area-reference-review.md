# Area-rule reference curve: agent sample finding

In `aero-4.4`, the grey curve labelled “fuselage + wing, straight”
used S_base + (1−k) S_wing. Over the allowed parameter range this
is the same as the current blue total area. It therefore ceased to
be an unindented reference as soon as k changed from zero.

The grey curve now uses S_base + S_wing, holding its indentation
at k = 0. The caption distinguishes this fixed reference from the
current blue curve. The existing scope already says indentation
removes volume; the caption and readout now make that explicit at
the point of comparison too. Each drag ratio continues to use the
Sears–Haack minimum at that setting's own volume. The numerical
drag calculation and minimum are unchanged.

Validation: the ten existing aerospace numerical regressions pass,
including independent area-rule slope integration and same-volume
minimum checks. The existing native browser test varies indentation,
wing hump and wing position in both themes. Its fully indented,
large-aft-wing state has ratio 1.000; both captures were inspected
and visibly retain the grey unindented hump above the current ideal
area curve. No source-verification or prerequisite status changes.
