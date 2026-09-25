/** Разбор файлов контента: md с JSON-заголовком (как в alice-vibe-3) и чистый JSON. */

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export const parseFrontmatter = (raw: string, source: string): { data: unknown; body: string } => {
  const match = FRONTMATTER_PATTERN.exec(raw);
  if (!match) {
    throw new Error("нет JSON-заголовка «--- … ---»");
  }
  const [, json = "", body = ""] = match;
  return { data: parseJson(json, source), body };
};

export const parseJson = (raw: string, source: string): unknown => {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(
      `${source}: некорректный JSON — ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
