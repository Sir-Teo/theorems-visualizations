# König–Egerváry attribution correction

The Hungarian Academy's [complete 1931 journal scan](https://real-j.mtak.hu/7307/1/MTA_MatematikaiEsPhysikaiLapok_38.pdf)
contains both original papers: König, *Graphok és mátrixok*, pp. 116–119
(PDF pp. 123–126), and Egerváry, *Matrixok kombinatorius tulajdonságairól*,
pp. 16–28 (PDF pp. 22–34). PDF SHA256:
`7c560f83cfee48b7523e91a8f9ebde3ddf9c52ad02b8903d44d7f6a1fd03cd81`.
Both papers' complete text was read, including König's alternating-path
argument, Egerváry's unweighted proof and weighted extension, footnotes and
German summaries. The p. 16 introduction/footnote, p. 27 German summary and
König's opening page were additionally inspected as rendered scans.
The complete [authorized English translation of König](https://arxiv.org/abs/2009.03780)
was used as a cross-check, not as a substitute for the original volume.

König proves equality of the maximum number of disjoint edges and minimum
number of covering vertices for finite bipartite graphs, using his K-path
construction, and translates it to matrix rows/columns. This supports the
entry's theorem and alternating-reachability proof. The atlas's network-flow
language is a modern reformulation.

The source comparison contradicts the old parenthetical attribution of
independent discovery. Egerváry's first paragraph explicitly makes König's
theorem the starting point. Footnote 2 identifies König's March 1931 talk.
Page 17 announces a new proof in §1 and the weighted generalization in §2;
the German summary on p. 27 confirms the same relationship. The corrected
credit therefore retains both mathematicians and distinguishes their roles.
This is an evidence-backed correction, not deletion of an uncertain claim
merely to remove a flag.

The exact originals now appear in the written item's and syllabus's references,
with a source link and translation link on the item. `algo-11.12` is closed.
Mathematical code, controls and dependencies are unchanged.

Validation: the existing exhaustive check verifies all 512 bipartite 3×3
graphs against brute-force minimum vertex covers. Focused static validation
has zero errors/warnings. The source queue/census and current-build human
worksheet are regenerated with the strict build. No new whole-atlas browser
pass or actual human review is claimed for this attribution/reference edit.
