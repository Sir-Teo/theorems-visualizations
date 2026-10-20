# Separate PL finite-rule and proof-text qualifications

Successor after prerequisite-only39d613103324c621d968bd1068d97a63d915be05. Exactly three text fields change, with every exact predecessor/successor saved in tests/pl-followup-qualifications.json; no dependency, syllabus, runtime, helper, function or raw source/review flag changes and no additional quota credit.

PL1.3 now states finitely many premises per rule. This is necessary for finite derivation-tree equivalence: take axioms p_n for every natural n and an infinitary rule deriving q from all p_n. Its least rule-closed set contains q, but any derivation of q has infinitely many immediate children and cannot be a finite tree. All rules in the displayed language are already finitely premised.

PL3.2 retains general terminating-relation Newman's lemma and its well-founded proof; removes the false inference that single-step local forks must be finitely many. Infinitely many disjoint diamonds a_n→b_n,c_n and b_n,c_n→d_n terminate in at most two steps yet have infinitely many distinct local forks. A finite presentation/coverage argument is separate from the lemma; no decision procedure for a general relation is supplied.

PL4.3 fixes two nearby proof sentences. For a numeric value argument, succ yields a numeric value, whereas pred/iszero use computation rules; succ of a numeric value does not need to step. The correct converse counterexample is ill-typed `if true then 0 else false`, which nevertheless steps to0. The previous stuck `succ true` did not refute that converse. The actual unchanged evaluator/type checker supplies these witnesses.

Own explicit final46-object/function/flag/helper/nonowned-byte and115-row audit passes against accepted5622b507 PL with the declared14append-only inputs plus exact qualification fields. Eight prerequisite math groups34,818checks and additionalqualification witnesses pass. Native actual320and253fullstatement/scope/proof gates follow; initial inherited layout failures, if any, will remain preserved and require a separate equivalent-wrap successor. No source closure, globals or runtime changes.

Final successor evidence:264 qualification checks pass; full preservation guard passes46objects/functions/flags/helpers and115rows with only the exact declared field exceptions. Both actual253px and production320px captures now cover all14changed consumers in both themes, with112complete field images personally inspected. See pl-followup-evidence.json and the final section of pl-followup-prerequisites.md. Runtime/source flags/dependencies were preserved.
