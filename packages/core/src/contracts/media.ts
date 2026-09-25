/** Медиа-манифест: ключ → файл. Заполняется скриптом импорта (docs/media-pipeline.md). */
import { z } from "zod";

export const mediaEntrySchema = z.object({
  /** Публичный путь от корня приложения (напр. "media/portrait-noelle.webp") или null — заглушка. */
  file: z.string().nullable(),
  alt: z.string().default(""),
  /** Подсказка импорта: "<slug>/<stem>" внутри public/media alice-vibe-3. */
  vibe3: z.string().optional(),
  source: z.enum(["vibe3", "inbox", "none"]).default("none"),
});

export const mediaManifestSchema = z.record(z.string(), mediaEntrySchema);

export type MediaEntry = z.infer<typeof mediaEntrySchema>;
export type MediaManifest = z.infer<typeof mediaManifestSchema>;
