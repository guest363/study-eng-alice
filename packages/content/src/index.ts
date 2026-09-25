/**
 * Контент: регионы (md+JSON), лексика, квесты, реплики Паймон, медиа-манифесты.
 * Единственный источник правды по курсу — слова и тексты в коде запрещены (agent.md, правило 7).
 */

export { type Catalog, loadCatalog } from "./catalog";
export { findCatalogProblems } from "./checks";
export { parseFrontmatter, parseJson } from "./parser";
