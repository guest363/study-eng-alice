/**
 * Карточка слова в саду и в коллекции: картинка (или эмодзи-заглушка), английское
 * слово, русский перевод и пример. Ничего не оценивает и не добавляет баллов.
 */
import type { ElementId } from "@tw/core";
import { cn } from "../cn/cn";
import styles from "./word-card.module.css";

export type WordCardProps = {
  readonly en: string;
  readonly ru: string;
  readonly emoji?: string | null;
  /** Публичный путь картинки из медиа-манифеста; null — рисуем эмодзи. */
  readonly imageSrc?: string | null;
  readonly example?: { readonly en: string; readonly ru: string } | null;
  readonly element?: ElementId;
  /** Стадия сада: росток → бутон → цветок (RF-5.2). */
  readonly stage?: "sprout" | "bud" | "flower";
  readonly onSpeak?: () => void;
  readonly className?: string;
};

export const WordCard = ({
  en,
  ru,
  emoji,
  imageSrc,
  example,
  element,
  stage,
  onSpeak,
  className,
}: WordCardProps) => (
  <article className={cn(styles.card, element && styles[element], className)}>
    <div className={styles.picture} data-stage={stage ?? "none"}>
      {imageSrc ? (
        <img className={styles.image} src={imageSrc} alt="" />
      ) : (
        <span className={styles.emoji} aria-hidden="true">
          {emoji ?? "🔤"}
        </span>
      )}
    </div>
    <div className={styles.body}>
      <p className={styles.en}>
        {en}
        {onSpeak ? (
          <button
            type="button"
            className={styles.speak}
            onClick={onSpeak}
            aria-label={`Послушать ${en}`}
          >
            🔊
          </button>
        ) : null}
      </p>
      <p className={styles.ru}>{ru}</p>
      {example ? (
        <p className={styles.example}>
          <span className={styles.exampleEn}>{example.en}</span>
          <span className={styles.exampleRu}>{example.ru}</span>
        </p>
      ) : null}
    </div>
  </article>
);
