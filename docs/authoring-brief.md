# Brief for writing a chapter

This is the brief given to each agent that writes a chapter. Placeholders: `<col>` = collection id, `<n>` = chapter number, `<NN>` = two-digit chapter number, `<collection title>`. When the brief assigns only a range of items, write only those, in the part file named in the assignment.

You are writing chapter <n> of the collection `<col>` — <collection title> — in /home/user/theorems-visualizations ("Ideas, Visualized": an atlas of the load-bearing ideas of human knowledge, each with an interactive visualization, all connected in one dependency graph; it already holds 1,062 results from Rudin's analysis books with a very high quality bar, and is growing to 85 collections in 13 fields). The owner's priorities: breadth, ambition, and **a good way of visualizing everything** — every item must have a visualization a student would be proud to explore.

## Read first
1. AUTHORING.md — the rulebook: item fields, rich text, the quality bar (§2), the full `viz(v)` API (§3), kits (§5).
2. docs/fields.md — the section for your field.
3. The kit docs that exist: docs/kits.md (graph, steps, table), docs/kits-science.md (phasePlane, fields, quantum, mol, circuit), docs/kits-world.md (globe, timeline, agents, curves, tree) — and their demo modules in tools/demos/*.js, which are working examples. Use kits where they fit; they give consistent, tested building blocks.
4. content/<col>/collection.js and content/<col>/syllabus.js — your chapter's planned items: `num, kind, name, deps, refs, pic`. The `pic` line is the agreed visualization plan; follow its spirit (improve it if you find a better idea that still tests the claim).
5. One finished chapter for the quality bar: content/pma/ch04.js (look at several items and their viz code).

## Write
Create content/<col>/ch<NN>.js (and part files ch<NN>-b.js, ch<NN>-c.js, … of 8–12 items each if the chapter has more than ~12 items; parts export only `collection`, `chapter`, `items`):

```js
// <collection title> — Chapter <n>: <title>
export default {
  collection: '<col>',
  chapter: <n>,
  title: '<chapter title from the syllabus>',
  summary: String.raw`<the syllabus summary, polished>`,
  items: [ { num, kind, name, statement, idea, caption, deps, refs, tags, scope?, credit?, links?, viz(v) {…} }, … ],
};
```

- **Every** planned item of chapter <n> (skip cross-listing entries `{ num, alias, name }`: those ideas live in another collection and appear on your chapter page automatically; cite the alias target in `deps` where needed), with exactly the syllabus `num` and `kind`, and its name (polish wording only if it helps). Never renumber. If an item is genuinely wrong or redundant, still write it as well as you can and flag it in your report.
- `statement`: complete and faithful, your own words (never copy a textbook), with hypotheses/scope. `idea`: why it is true / how it works, 2–5 sentences, naming the earlier results that do the work. `caption`: what to drag/click and what to notice.
- `deps`: start from the syllabus deps; fix them if wrong. Only ids that exist (written items in data/index.json or planned items in any content/*/syllabus.js). Point backwards; no cycles.
- `refs` from the syllabus; `credit` (who, when) when there is a clear attribution; `scope` for laws/models (where they hold).
- `viz(v)` for every item (Definitions too, whenever a good picture exists). It must be about this idea, interactive (handles, sliders, selects, clicks, step-through), make the invisible visible, compute honestly, carry a live `readout` that verifies the claim, use palette names only (light/dark), and redraw fast. Let the reader break the hypothesis/leave the regime and watch the conclusion fail. Vary the pictures across the chapter.
- Shared helpers for several items go at the top of the module as plain functions. No imports. Use `String.raw` for TeX strings.

## Check (iterate until clean)
```bash
node scripts/build.mjs                                   # must report 0 errors
node scripts/check.mjs <col>/<n> --shots --modes    # every item ✓, no quality warnings
node scripts/check.mjs <col>/<n> --shots --dark     # then look at the dark screenshots
node scripts/check.mjs <col>/<n> --shots --still    # animations and step players: shows the frame set by their `still` option
```
Without `--still`, screenshots catch animations about 1.5 s in; give animated items (`v.animate`, `v.steps`) a `still` frame and review it with `--still`. Stage helpers worth knowing: `s.clip(fn)` clips drawing to the window; `M.solve(A, B)` accepts a matrix right-hand side; scene3 handles take `onDrag(H)` and expose `H.visible` / `H.dragging`.

**Open and look at every screenshot** (Read the PNGs in shots/: `<id>.png`, `<id>~k.png` for modes, `<id>.dark.png`). Fix overlapping labels, things drawn off-canvas, unreadable readouts, empty-looking panels, wrong numbers. Iterate until every picture is something you would be proud to show a student.

## Rules
- Create/edit only content/<col>/ch<NN>*.js. Do not edit assets/, scripts/, docs/, other chapters or syllabi, and do NOT run git. If the runtime or a kit lacks something, work around it in your chapter (helper functions) and mention it in your report.
- Final report (concise): items written (count), kinds, notable visualizations, any deviations from the syllabus (deps changed, items flagged), runtime/kit gaps you hit, and the final check summary line.
