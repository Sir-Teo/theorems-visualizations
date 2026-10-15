// Collection metadata (see AUTHORING.md §0).
export default {
  id: "dist",
  short: "DIST",
  title: "Distributed Computing",
  field: "cs",
  area: "systems",
  order: 60,
  source: {
    type: "course",
    refs: ["Lynch, Distributed Algorithms", "Attiya & Welch, Distributed Computing"]
  },
  blurb: String.raw`Time and order without a global clock, consensus and its impossibility, Byzantine agreement, replication protocols such as Paxos and Raft, and epidemic algorithms.`
};
