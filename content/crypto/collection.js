// Collection metadata (see AUTHORING.md §0).
export default {
  id: "crypto",
  short: "CRYPTO",
  title: "Cryptography",
  field: "cs",
  area: "information",
  order: 50,
  source: {
    type: "course",
    refs: ["Katz & Lindell, Introduction to Modern Cryptography", "Boneh & Shoup, A Graduate Course in Applied Cryptography"]
  },
  blurb: String.raw`Perfect secrecy, pseudorandomness and computational security, block ciphers and hashing, public-key encryption and signatures (Diffie–Hellman, RSA, elliptic curves), zero knowledge and lattices.`
};
