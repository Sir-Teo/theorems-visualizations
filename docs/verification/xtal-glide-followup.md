# XTAL3.6: complete glide orbits

The conditional visual review found that the applications slider showed8 while the glide renderer silently capped it at6. Its fixed view also clipped the later atoms/arrows of the c and n glides.

The local renderer now applies every requested operation through the visible0–12range. It fits the projections of the actual orbit, reference plane and cell corners with margins in the current camera orientation. Camera rotation recomputes that fit. Returning to screw mode restores its original reference view. The readout reports the exact alternating signed height for the selected step count. Crystallographic affine transformations, glide vectors and lattice tests are unchanged; no shared runtime, runner or inventory was edited.

Independent numerical validation uses homogeneous affine-matrix multiplication for reflection in y=0 plus the selected translation. It checks every produced point and connecting arrow, counts and displacement readouts for all5types (mirror,a,c,n,d) and all13counts0–12:65cases. Returning to the screw reference is also checked. `node --test tests/verification-xtal-glide.test.mjs tests/verification-xtal.test.mjs` passed. The focused static check passed1item with0errors/0warnings.

Native validation, `node tests/verification-xtal-glide-browser.mjs`, passed **48states** serially with local KaTeX0.16.11. Both themes cover every glide at k=0,1,8,12; real camera drags for c/n at12; and default/restored screw reference modes. Instrumentation observes actual production projected points and arrow endpoints, verifies counts k+1/k, and requires each to stay at least9pixels inside the stage. No blank canvas, runtime/TeX error or nonfinite readout occurred. All48PNGs were inspected in8contact sheets: complete paths, readable context, and control/readout agreement are restored.

Machine evidence in `xtal-glide-followup.json` includes source-file hash, every inspected PNG SHA256, measured screen positions and screenshots under `/tmp/atlas-xtal-glide/`. Original conditional-capture findings and hashes remain in `conditional-visual-energy.json`; the old affected PNGs were additionally archived under `/tmp/conditional-energy-original/` before final refresh. This is agent visual inspection, not the human339sample.

Source is frozen after this focused fix. The parent owns the full XTAL collection refresh; this reviewer launched no full collection sweep.
