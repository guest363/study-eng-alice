/** Классификация файла контента по пути относительно src/. */

export type ContentFileKind =
  | { kind: "region"; regionSlug: string }
  | { kind: "words"; regionSlug: string }
  | { kind: "quest"; regionSlug: string }
  | { kind: "region-media"; regionSlug: string }
  | { kind: "companion" }
  | { kind: "paimon-bank" }
  | { kind: "reactions" }
  | { kind: "global-media" };

export const classifyPath = (relPath: string): ContentFileKind | null => {
  const path = relPath.replace(/^\.\//, "").replace(/^src\//, "");
  const regionMatch = /^regions\/([^/]+)\/(.+)$/.exec(path);
  if (regionMatch) {
    const regionSlug = regionMatch[1] ?? "";
    const name = regionMatch[2] ?? "";
    if (name === "region.md") {
      return { kind: "region", regionSlug };
    }
    if (name === "words.json") {
      return { kind: "words", regionSlug };
    }
    if (name === "media.manifest.json") {
      return { kind: "region-media", regionSlug };
    }
    if (name.startsWith("quests/") && name.endsWith(".md")) {
      return { kind: "quest", regionSlug };
    }
    return null;
  }
  if (/^companions\/[^/]+\.md$/.test(path)) {
    return { kind: "companion" };
  }
  if (path === "paimon/bank.json") {
    return { kind: "paimon-bank" };
  }
  if (path === "reactions.json") {
    return { kind: "reactions" };
  }
  if (path === "media.manifest.json") {
    return { kind: "global-media" };
  }
  return null;
};
