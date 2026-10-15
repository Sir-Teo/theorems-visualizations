# Writing a syllabus

A **syllabus** is the planned inventory of a collection: every item it will contain, with its
number, kind, name and dependencies, but no statement or visualization yet. It is written
*before* any chapter, so that ids exist before other collections cite them and the whole atlas
can be drawn as a skeleton. Items in a syllabus that have not been written yet appear on the
map as faded "planned" nodes and on the status page. When a chapter file defines an item with
the same number, the written item replaces the planned one.

File: `content/<collection>/syllabus.js`

```js
// Syllabus — Classical Mechanics (curated course; see collection.js for references)
export default {
  collection: 'mech',
  chapters: [
    {
      n: 1,
      title: 'Newton’s laws',
      summary: String.raw`2–4 sentences, in your own words, on the arc of the chapter.`,
      items: [
        { num: '1.1', kind: 'Definition', name: 'Inertial reference frame', deps: [], refs: ['Taylor §1.4'],
          pic: 'Two carts on a track, one frame accelerating: a free puck curves only in the non-inertial frame.' },
        { num: '1.2', kind: 'Law', name: 'Newton’s first law', deps: ['mech-1.1'], refs: ['Taylor §1.4'],
          pic: 'Drag the friction slider to zero and watch the puck keep its velocity forever.' },
        // …
      ],
    },
    // …
  ],
};
```

## Cross-listings

When an idea already lives in another collection, do not copy it: cite it in `deps`. If your course genuinely covers it in a chapter, list it with a cross-listing entry, which takes a number but is not a new node:

```js
{ num: '6.7', alias: 'toc-9.7', name: 'Undecidability of the halting problem' },
```

References to `logic-6.7` then resolve to `toc-9.7`, `#/t/logic-6.7` redirects there, and the chapter page shows the owner's card under "Cross-listed". Numbers stay reserved (ids are append-only), so an existing duplicate can be turned into a cross-listing at any time: `node scripts/crosslist.mjs logic-6.7=toc-9.7`. `node scripts/dupes.mjs [col …]` lists likely duplicates that are not yet linked; prefer the more elementary or more natural home as owner, and keep both (linked by `see` or `deps`) when the two differ in generality.

## Research first

A syllabus is a map of a subject, and a map drawn from memory has holes. Before writing one:

1. **Gather the canon.** Fetch the tables of contents of the references in `collection.js`
   (publisher pages, the author's site, open-access PDFs, Google Books previews), and the
   syllabi of two or three well-regarded university courses on the subject (MIT OpenCourseWare,
   Stanford, Cambridge/Oxford lecture lists, Tong's notes for physics, CORE Econ for economics…).
2. **Collect the named results.** Wikipedia's "List of theorems / laws / paradoxes / algorithms
   in …" pages, the subject's encyclopedia entries (SEP for philosophy, Scholarpedia, nLab,
   PlanetMath) and the indices of the references.
3. **Compare and decide.** Every topic that appears in most of these sources belongs in the
   syllabus; famous named results belong in it; obscure ones need a reason. Note what you left
   out and why.
4. **Verify the facts you encode**: attributions and dates, the exact statement a name refers
   to, and the section numbers in `refs` (cite chapter-level refs when you cannot check a
   section number).
5. **Record your sources** in a comment block at the top of `syllabus.js` (course pages, TOCs,
   lists consulted), so the next person can audit the map.

Book-anchored collections take their inventory from the book itself (extract the numbered
items from the text, as was done for `ladr`) rather than from memory.

## Fields

| field | rule |
|---|---|
| `num` | `chapter.n` (or `chapter.section.n` for book-anchored collections that number that way). **Book-anchored** collections use the book's own numbers exactly. **Curated** collections number in order, 1.1, 1.2, …; once published, numbers never change (append new items at the end of a chapter). |
| `kind` | one of `Theorem Lemma Corollary Proposition Definition Law Principle Postulate Algorithm Model Concept Phenomenon Method Paradox Hypothesis Invention Event` — pick the most honest one: a physical law is a `Law`, Le Chatelier's principle a `Principle`, supply-and-demand equilibrium a `Model`, consonance a `Phenomenon`, the printing press an `Invention`, comparative advantage a `Theorem` only if stated and proved as one (otherwise `Principle`). |
| `name` | short and recognizable (≤ 60 chars): the classical name if there is one. |
| `deps` | ids of items the explanation genuinely relies on: a proof uses it, a derivation starts from it, a concept cannot be stated without it, an invention needed it. Point **backwards** (no cycles). Cross-collection ids are encouraged (e.g. `mech-5.2` ← `ladr-7.29`, `micro-3.4` ← `pma-5.10`) — only cite ids that exist in `data/index.json` (written items) or in a syllabus already in `content/`. 0–5 per item; foundations have none. |
| `refs` | 1–2 pointers into the references listed in `collection.js` (`'Taylor §7.3'`, `'CLRS 4e Thm 22.10'`). Book-anchored collections may omit `refs`. |
| `pic` | one sentence: what the interactive visualization will show and what the reader manipulates. Every item must be *visualizable and testable on screen* — if you cannot think of a good picture, reconsider whether the item belongs. |
| `tags` | optional, 1–3 lowercase tags. |

Chapter `summary` texts are written in your own words. Never copy a textbook's sentences.

## What belongs in a syllabus

- **Book-anchored** (`source.type: 'book'`): every numbered theorem, lemma, corollary and
  proposition of the book, plus the key numbered definitions later results rely on (typically
  3–10 per chapter). Skip examples and exercises unless they are famous results in their own
  right (then include them under their number).
- **Curated** (`source.type: 'course'`): the results, laws, models and concepts a strong student
  of the subject should know after a full course, in a sensible teaching order, 10–25 items per
  chapter, 8–14 chapters. Breadth over minutiae; prefer things with a crisp statement and a
  picture you can push on. Include the famous named results, the workhorse concepts, the
  classic counterexamples and paradoxes, and the bridges to other fields.

## Checking

```bash
node scripts/build.mjs --verbose     # validates syllabi too (kinds, numbers, deps, cycles)
node scripts/report.mjs mech         # per-chapter written / planned counts
```
