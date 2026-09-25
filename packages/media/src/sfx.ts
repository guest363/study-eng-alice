/**
 * Короткие звуки: сундук, реакция стихий, полив сада, цветение (task.md RF-10.2).
 *
 * Источники — CC0 или собственные записи, оригинальные треки Genshin не используются
 * (RF-10.3, микро-ресерч R5). Путь к файлу приходит из медиа-манифеста контента;
 * если файла нет — звук просто не играет, ошибки не показываем.
 */
export const SFX_NAMES = ["chest", "reaction", "water", "bloom"] as const;

export type SfxName = (typeof SFX_NAMES)[number];

/** Минимальный кусок HTMLAudioElement, который нужен проигрывателю. */
export type AudioPlayer = {
  play: () => void;
  /** Сбрасываем на ноль, чтобы один звук не заглушал другой при быстрых тапах. */
  currentTime: number;
};

export type SfxFactory = (src: string) => AudioPlayer;

export type SfxOptions = Readonly<{
  /** Ключ SFX → публичный путь файла (из media.manifest.json). */
  resolve: (name: SfxName) => string | null;
  factory?: SfxFactory;
}>;

const defaultFactory: SfxFactory = (src) => new Audio(src) as AudioPlayer;

export const createSfxPlayer = (options: SfxOptions) => {
  const factory = options.factory ?? defaultFactory;
  let enabled = true;
  let last: LastPlayedSfx | null = null;

  return {
    /** Проиграть звук, если он есть и включён. Ничего не бросает. */
    play: (name: SfxName): boolean => {
      if (!enabled) {
        return false;
      }
      const src = options.resolve(name);
      if (!src) {
        return false;
      }
      const player = factory(src);
      player.currentTime = 0;
      player.play();
      last = { name, src };
      return true;
    },
    setEnabled: (value: boolean): void => {
      enabled = value;
    },
    isEnabled: (): boolean => enabled,
    /** Что звучало последним — пригодится отладке и тестам. */
    lastPlayed: (): LastPlayedSfx | null => last,
  };
};

export type LastPlayedSfx = Readonly<{ name: SfxName; src: string }>;

export type SfxPlayer = ReturnType<typeof createSfxPlayer>;
