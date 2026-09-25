/**
 * Импорт медиа (task.md §6.3, docs/media-pipeline.md):
 *  1. Для каждого ключа манифестов без файла ищет картинку в inbox
 *     (packages/content/media/inbox/<ключ>.{png,webp,jpg,jpeg}) — арты Nano Banana.
 *  2. Иначе — в public/media alice-vibe-3 по подсказке "vibe3": "<slug>/<имя-без-расширения>".
 *  3. Копирует в apps/web/public/media/<ключ>.<расширение> и вписывает путь в манифест.
 *
 * Запуск: yarn workspace @tw/content media:import [--vibe3 <путь к alice-vibe-3>]
 * Отсутствующие ключи остаются file: null — рантайм покажет SVG-заглушку.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { parseJson } from "../src/parser";

const repoRoot = resolve(import.meta.dirname, "../../..");
const contentSrc = resolve(import.meta.dirname, "../src");
const inboxDir = resolve(repoRoot, "packages/content/media/inbox");
const publicMediaDir = resolve(repoRoot, "apps/web/public/media");
const vibe3Root = (() => {
  const flagIndex = process.argv.indexOf("--vibe3");
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) {
    return resolve(process.argv[flagIndex + 1] ?? "");
  }
  return resolve(repoRoot, "../alice-vibe-3");
})();

const IMAGE_EXTENSIONS = [".webp", ".png", ".jpg", ".jpeg"];

const findManifests = (dir: string): string[] => {
  const manifests: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      manifests.push(...findManifests(full));
    } else if (entry === "media.manifest.json") {
      manifests.push(full);
    }
  }
  return manifests;
};

const probe = (stem: string, extensions: ReadonlyArray<string>, label: string): string | null => {
  for (const extension of extensions) {
    if (existsSync(stem + extension)) {
      console.log(`  ✔ ${label}: ${relative(repoRoot, stem + extension)}`);
      return stem + extension;
    }
  }
  return null;
};

const manifests = findManifests(contentSrc);
if (manifests.length === 0) {
  console.error("Манифесты не найдены");
  process.exit(1);
}

let copied = 0;
const missing: string[] = [];

for (const manifestPath of manifests) {
  const manifest = parseJson(readFileSync(manifestPath, "utf8"), manifestPath) as Record<
    string,
    { file: string | null; alt?: string; vibe3?: string; source?: string }
  >;
  let changed = false;

  for (const [key, entry] of Object.entries(manifest)) {
    if (entry.file) {
      continue;
    }
    const inboxHit = probe(join(inboxDir, key), IMAGE_EXTENSIONS, `inbox ${key}`);
    const vibe3Hit = entry.vibe3
      ? probe(join(vibe3Root, "public/media", entry.vibe3), IMAGE_EXTENSIONS, `vibe3 ${key}`)
      : null;
    const hit = inboxHit ?? vibe3Hit;
    if (!hit) {
      missing.push(key);
      continue;
    }
    const extension = hit.slice(hit.lastIndexOf("."));
    mkdirSync(publicMediaDir, { recursive: true });
    copyFileSync(hit, join(publicMediaDir, key + extension));
    entry.file = `media/${key}${extension}`;
    entry.source = inboxHit ? "inbox" : "vibe3";
    changed = true;
    copied += 1;
  }

  if (changed) {
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

console.log(`Скопировано: ${copied}. Без арта (останется заглушка): ${missing.length}`);
if (missing.length > 0) {
  console.log(missing.map((key) => `  - ${key}`).join("\n"));
}
