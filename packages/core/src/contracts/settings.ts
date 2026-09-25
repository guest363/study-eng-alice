/** Настройки приложения (форма родительского уголка, RF-11.3). */
import { z } from "zod";

export const settingsSchema = z.object({
  travelerName: z.string().min(1, "Имя путешественницы не может быть пустым").max(20),
  ttsVoice: z.enum(["us", "uk"]).default("us"),
  ttsRate: z.number().min(0.6).max(1.1).default(0.85),
  musicOn: z.boolean().default(true),
  sfxOn: z.boolean().default(true),
  dailyTimeLimitMinutes: z.number().int().min(10).max(30).default(15),
});

export type Settings = z.infer<typeof settingsSchema>;
