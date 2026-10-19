// Lossless transport for the light catalog. The app still uses ordinary item objects.
const DICTIONARIES = ['col', 'kind', 'file'];
const LINKS = ['deps', 'pdeps', 'see', 'intro'];

export function encodeCatalog(catalog) {
  const { items, ...rest } = catalog;
  const keys = [...new Set(items.flatMap(Object.keys))].filter(k => k !== 'id');
  const dictionaries = Object.fromEntries(DICTIONARIES.map(k => [k, [...new Set(items.map(it => it[k]))]]));
  const ids = new Map(items.map((it, i) => [it.id, i]));
  const columns = Object.fromEntries(keys.map(k => [k, items.map(it => {
    if (it[k] === undefined) return null;
    if (dictionaries[k]) return dictionaries[k].indexOf(it[k]);
    if (LINKS.includes(k)) return it[k].map(id => ids.get(id) ?? id);
    return it[k];
  })]));
  return { ...rest, itemEncoding: 1, dictionaries, columns };
}

export function decodeCatalog(catalog) {
  if (!catalog.itemEncoding) return catalog;
  if (catalog.itemEncoding !== 1) throw new Error('Unsupported catalog encoding');
  const { itemEncoding, dictionaries, columns, ...rest } = catalog;
  const items = columns.num.map((_, i) => Object.fromEntries(Object.entries(columns)
    .filter(([, values]) => values[i] !== null)
    .map(([k, values]) => [k, dictionaries[k] ? dictionaries[k][values[i]] : values[i]])));
  for (const it of items) it.id = `${it.col}-${it.num}`;
  for (const it of items) for (const k of LINKS) if (it[k]) it[k] = it[k].map(id => typeof id === 'number' ? items[id].id : id);
  return { ...rest, items };
}
