# Sample capture anomalies

Initial visual inspection found two PNGs with left-hand page content duplicated
over the right panel: `opt-4.3` and later `qchem-4.3`. Their automated
runtime, TeX and blank-canvas checks passed. A passing automated report
therefore did not establish that those particular captures were faithful.

Isolated native inspection found one visualization host, two distinct
canvases and the expected DOM/readout for each page. Fresh isolated PNGs
show the correct distinct panels. For optimization, nine fresh pages
in three concurrent batches produced eighteen identical initial/settled
captures without reproducing the defect. The later helium recapture
shows its radial-density panel and correct variational-energy readout.

The cause remains unresolved. Neither a product rendering defect nor
a specific concurrency/font explanation has been established. The review
records disclose the bad initial captures and use the inspected isolated
recaptures for their panel findings. No production renderer or screenshot
checker behaviour was changed on the strength of an unconfirmed cause.

A third artifact occurred during the 24-page light/dark follow-up:
`em-1.18.dark.png` duplicated the globe panel, caption and controls over
the experiment-limit panel. Automated checks again passed. Its bad PNG
was preserved as `/tmp/agent-review/em-1.18-duplicated.dark.png`.
An isolated native recapture shows the distinct globe and limit-history
panels correctly and was inspected. This is another observed artifact,
not proof of a particular cause; the original-evidence flag for the
historical limits remains open.

The next batch produced two further duplicated-panel PNGs: `rel-2.14.png`
(light) and `info-3.9.dark.png`. Both passed automated runtime/TeX checks.
The bad files were preserved under `/tmp/agent-review/` with `-duplicated`
in their names. Fresh isolated native captures passed and were visually
inspected: relativity shows distinct carried-axis and velocity-loop panels;
information theory shows distinct simplex and probability panels. The cause
remains unresolved; these observations do not establish a production defect.
