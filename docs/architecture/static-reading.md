# Static reading pages for accepted legacy ideas

October 22, 2026. This U3 slice assembles a **local site candidate** containing the existing interactive atlas plus real static reading pages. It performs no publication/deployment and does not release the new-format local pilots.

## Delivered contract

`ideas/` is a collection directory. `ideas/collections/<collection>/` lists chapter/idea numbers in natural order. `ideas/<legacy-id>/` contains the existing statement, explanation, qualifications, visualization caption, prerequisites/related ideas, bibliography and original verification flag. Static KaTeX HTML/MathML renders formulas without JavaScript. Reading containers fit the viewport; long inline/display formulas have local horizontal scrolling instead of widening the whole page. Existing source strings and the shared interactive renderer remain unchanged.

All 7,751 ideas and 76 aliases are frozen from accepted content commit `facab15e297c645d4826935f2c011a4cf367ee88`. The 85 collection directories plus library give 7,837 canonical pages. Alias pages link to the target without JavaScript and redirect with it; they use the target canonical and are excluded from the sitemap. They do not add authored ideas. Planned items and local `x-*` explorations are not static reading pages.

`static-pages/accepted.json` pins the exact identity/alias roster, a digest of every displayed source projection and a digest of all generated data files. The latter ignores only existing generation timestamps in index/home. Both the source's written inventory and production catalog must exactly match the accepted roster. Changed explanations, titles, citations, dependencies, aliases, stale detail shards or unexpected generated files fail closed. This explicit snapshot is not permission to infer that a later draft HEAD is accepted.

The renderer reuses the existing rich-text parser/macros and bundled KaTeX 0.16.11 in Node, with strict math checks. Two existing expressions attach a degree superscript to a spacing atom (`1147\,^\circ`, `727\,^\circ`), which this KaTeX cannot typeset directly. The static wrapper inserts an empty base (`\,{}^\circ`) only for that pattern. It retains the mathematical reading and source strings, records the normalization count and rejects other math errors. It does not alter the visualization runtime.

## Routes, state and indexing

Static pages are companions; the existing hash router is unchanged. An **Open the interactive explanation** link points back to `#/t/<id>`. The optional browser enhancement preserves the entire static URL query as an opaque suffix on that route, including share-state tokens, embed mode, duplicates, encoded values and literal question marks. Alias redirects preserve both query and fragment. A reading-section fragment remains local to reading; it is not interpreted as a visualization answer.

Without JavaScript, reading text, formulas, source qualifications, collection navigation and static prerequisites remain available. Visualization replay requires JavaScript as before. Theme controls appear only when enhancement is available. No private notes or progress are migrated or reset; only the existing theme preference is read/written.

No canonical base is guessed. Without `--base-url`, the candidate emits no canonical/sitemap and marks static pages noindex. With a clean explicit HTTP(S) directory base, it emits self-canonical URLs and a sitemap for exactly the canonical reading pages, excluding aliases. Both root and project-prefix serving are supported through relative assets/navigation.

The current GitHub Pages API reported `http://teozeng.dev/theorems-visualizations/` with HTTPS enforcement false. This is recorded deployment metadata and was used as the candidate's explicit canonical base; an HTTPS web-open attempt did not return accessible page content. No claim of live new routes or verified HTTPS delivery follows. The release owner must verify the actual destination/protocol when authorizing deployment; rebuilding with a different base is explicit.

## Assembly and future maintenance

`scripts/build-static-ideas.mjs` requires a new output directory outside the source checkout and refuses existing destinations/special-file inputs. It validates before rendering/writing. It copies only the existing deployable root shell, assets, content, data and `.nojekyll`, adds a Read link and no-JavaScript reading fallback to the **candidate copy** of the root shell, then writes static pages and a build report. Local explorations, orientations, labs, source/review documents and authoring manifests are excluded from the assembled site. It never calls a deploy tool or rewrites the source shell/workflows.

The report binds the accepted source/data, generated output digest and key rendering inputs. An interrupted filesystem write may leave a partial new candidate; it is not a successful build or deployable artifact. Inspect the report and verification results, then choose a new directory for a retry. This tool never deletes an existing candidate automatically.

At the next accepted content checkpoint, regenerate the roster/digests from that explicitly accepted source, inspect the changes and rerun the [integration rehearsal](../integration/static-reading.md). Do not refresh the pin to make a failing check green. Production publication automation, migration of legacy hash URLs, new-format public catalogs/pages, orientation routes, release-specific rights, public withdrawal/version retention and note migration remain open work.
