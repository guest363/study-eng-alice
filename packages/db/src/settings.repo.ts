/**
 * Настройки и инвентарь — по одной записи на базу (task.md §8.3: единичные ключи).
 * Чтение идёт через TanStack Query, запись — через мутацию с инвалидацией.
 */
import { type Inventory, inventorySchema, type Settings, settingsSchema } from "@tw/core";
import { SINGLETON_KEY, type TeyvatDb } from "./schema";

/** Настройки по умолчанию: первый запуск, до того как родитель что-то поменял. */
export const DEFAULT_SETTINGS: Settings = settingsSchema.parse({
  travelerName: "Путешественница",
  ttsVoice: "us",
  ttsRate: 0.85,
  musicOn: true,
  sfxOn: true,
  dailyTimeLimitMinutes: 15,
});

export const DEFAULT_INVENTORY: Inventory = inventorySchema.parse({});

/** Битые настройки не должны ломать приложение: падаем на значения по умолчанию. */
export const readSettings = async (db: TeyvatDb): Promise<Settings> => {
  const row = await db.settings.get(SINGLETON_KEY);
  if (!row) {
    return DEFAULT_SETTINGS;
  }
  const parsed = settingsSchema.safeParse(row.value);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
};

export const writeSettings = async (db: TeyvatDb, settings: Settings): Promise<Settings> => {
  const value = settingsSchema.parse(settings);
  await db.settings.put({ key: SINGLETON_KEY, value });
  return value;
};

export const readInventory = async (db: TeyvatDb): Promise<Inventory> => {
  const row = await db.inventory.get(SINGLETON_KEY);
  if (!row) {
    return DEFAULT_INVENTORY;
  }
  const parsed = inventorySchema.safeParse(row);
  return parsed.success ? parsed.data : DEFAULT_INVENTORY;
};

export const writeInventory = async (db: TeyvatDb, inventory: Inventory): Promise<Inventory> => {
  const value = inventorySchema.parse(inventory);
  await db.inventory.put({ key: SINGLETON_KEY, ...value });
  return value;
};

/**
 * Сброс прогресса из родительского уголка (RF-11.3). Подтверждение спрашивает человек,
 * здесь только сама очистка: слова, дни, сессии, журнал и инвентарь, настройки — в
 * исходное состояние.
 */
export const resetProgress = async (db: TeyvatDb): Promise<void> => {
  await db.transaction(
    "rw",
    [db.wordsState, db.days, db.sessions, db.journal, db.inventory, db.settings],
    async () => {
      await Promise.all([
        db.wordsState.clear(),
        db.days.clear(),
        db.sessions.clear(),
        db.journal.clear(),
        db.inventory.clear(),
        db.settings.clear(),
      ]);
    },
  );
};
