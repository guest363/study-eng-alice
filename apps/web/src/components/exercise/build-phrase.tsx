/**
 * build-phrase: собираем фразу из слов-блоков (task.md RF-4.5).
 *
 * Перетаскивание работает пальцем (PointerSensor) и с клавиатуры (KeyboardSensor +
 * sortableKeyboardCoordinates), блоки озвучиваются по тапу, собранная фраза — целиком.
 * Порядок блоков детерминирован: один и тот же день — одна и та же раскладка.
 */
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isPhraseCorrect, type PhraseBlock, phraseBlocks, shuffledBlocks } from "@tw/core";
import { Button, cn, Kicker } from "@tw/ui";
import { useMemo, useState } from "react";
import { catalog, wordsById } from "../../lib/catalog";
import { useAudio } from "../../providers/app-providers";
import styles from "./build-phrase.module.css";

export type BuildPhraseProps = {
  readonly wordId: string;
  readonly seed: string;
  readonly answerShown: boolean;
  readonly onAnswer: (blockIds: string[]) => void;
  readonly onReplay: () => void;
};

const SortableBlock = ({
  block,
  onSpeak,
}: {
  readonly block: PhraseBlock;
  readonly onSpeak: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  return (
    <li
      ref={setNodeRef}
      className={cn(styles.block, isDragging && styles.dragging)}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className={styles.blockButton}
        onClick={onSpeak}
        {...attributes}
        {...listeners}
      >
        {block.text}
      </button>
    </li>
  );
};

export const BuildPhrase = ({
  wordId,
  seed,
  answerShown,
  onAnswer,
  onReplay,
}: BuildPhraseProps) => {
  const { speak } = useAudio();
  const labels = catalog.labels.exercise.buildPhrase;
  const word = wordsById.get(wordId);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const initial = useMemo(() => (word ? shuffledBlocks(word, seed) : []), [seed, word]);
  const [blocks, setBlocks] = useState<PhraseBlock[]>(initial);

  if (!word) {
    return null;
  }

  const onDragEnd = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) {
      return;
    }
    setBlocks((current) => {
      const from = current.findIndex((block) => block.id === active.id);
      const to = current.findIndex((block) => block.id === over.id);
      return from === -1 || to === -1 ? current : arrayMove(current, from, to);
    });
  };

  const phrase = blocks.map((block) => block.text).join(" ");

  return (
    <section className={styles.exercise}>
      <Kicker>{labels.prompt}</Kicker>
      <p className={styles.hint}>{labels.hint}</p>
      <div className={styles.result} aria-live="polite">
        <span className={styles.phrase}>{phrase}</span>
        <Button
          className={styles.speaker}
          onClick={onReplay}
          aria-label={catalog.labels.actions.replay}
        >
          🔊
        </Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={blocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className={styles.blocks}>
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onSpeak={() => speak(block.spoken, { slow: true })}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {answerShown ? (
        <p className={styles.shown}>
          {catalog.labels.feedback.shown} (
          {phraseBlocks(word)
            .map((block) => block.text)
            .join(" ")}
          )
        </p>
      ) : (
        <Button
          onClick={() => {
            if (
              isPhraseCorrect(
                word,
                blocks.map((block) => block.id),
              )
            ) {
              speak(word.en);
            }
            onAnswer(blocks.map((block) => block.id));
          }}
        >
          {catalog.labels.actions.check}
        </Button>
      )}
    </section>
  );
};
