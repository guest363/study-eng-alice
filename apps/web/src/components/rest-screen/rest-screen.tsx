/**
 * Экран отдыха: искры кончились (task.md RF-3.5). Тёплый стоп без «потери» и без
 * чувства вины — пропущенный день ничего не отнимает.
 */
import { Button, ElementalAura, Kicker, Panel } from "@tw/ui";
import { catalog } from "../../lib/catalog";
import { pickLine } from "../../lib/random-line";
import { useAudio } from "../../providers/app-providers";
import styles from "./rest-screen.module.css";

export type RestScreenProps = {
  readonly day: string;
  readonly onBack: () => void;
};

export const RestScreen = ({ day, onBack }: RestScreenProps) => {
  const { speak } = useAudio();
  const line = pickLine(catalog.paimonBank.rest, day);
  return (
    <Panel className={styles.panel}>
      <ElementalAura element="dendro" density="full" />
      <Kicker>{catalog.labels.session.dayClosedTitle}</Kicker>
      <h2 className={styles.title}>{catalog.labels.session.dayClosedBody}</h2>
      <p className={styles.line}>{line}</p>
      <p className={styles.hint}>{catalog.labels.session.restHint}</p>
      <Button
        onClick={() => {
          speak(line);
          onBack();
        }}
      >
        {catalog.labels.actions.next}
      </Button>
    </Panel>
  );
};
