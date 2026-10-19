# Sample capture anomalies

Visual inspection found two PNGs with left-hand page content duplicated
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
