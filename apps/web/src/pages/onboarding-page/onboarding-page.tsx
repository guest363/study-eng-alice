/**
 * Онбординг: имя путешественницы или готовый аватар-стихия (task.md RF-1.1).
 * Форма на React Hook Form + Zod, тексты ошибок на русском (agent.md, правило 2).
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ELEMENTS } from "@tw/core";
import { getDb, readSettings, settingsKeys, writeSettings } from "@tw/db";
import { Button, Kicker, Panel } from "@tw/ui";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { catalog } from "../../lib/catalog";
import { today } from "../../lib/time";
import styles from "./onboarding-page.module.css";

const ELEMENT_IDS = ELEMENTS.map((element) => element.id) as [
  (typeof ELEMENTS)[number]["id"],
  ...(typeof ELEMENTS)[number]["id"][],
];

const onboardingSchema = z.object({
  travelerName: z
    .string()
    .min(1, "Как тебя зовут, Путешественница?")
    .max(20, "Имя должно быть покороче — до 20 букв"),
  element: z.enum(ELEMENT_IDS, { error: "Выбери стихию" }),
  parentNoteRead: z.literal(true, {
    error: "Спроси у взрослого, можно начинать играть вместе",
  }),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export const OnboardingPage = () => {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { travelerName: "", element: "anemo", parentNoteRead: true },
  });
  const element = watch("element");

  const onSubmit = handleSubmit(async (values) => {
    const current = await readSettings(getDb());
    await writeSettings(getDb(), { ...current, travelerName: values.travelerName });
    await queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    setSaved(true);
  });

  return (
    <main className={styles.page}>
      <Panel className={styles.card}>
        <Kicker>Великое Безмолвие</Kicker>
        <h1 className={styles.title}>{catalog.paimonBank.dayOpen[0]}</h1>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            <span className={styles.label}>Как тебя зовут?</span>
            <input
              className={styles.input}
              autoComplete="off"
              aria-invalid={Boolean(errors.travelerName)}
              {...register("travelerName")}
            />
            {errors.travelerName ? (
              <span className={styles.error}>{errors.travelerName.message}</span>
            ) : null}
          </label>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>Выбери стихию</legend>
            <div className={styles.elements}>
              {ELEMENTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.element}
                  data-active={element === item.id}
                  onClick={() => setValue("element", item.id, { shouldValidate: true })}
                  aria-pressed={element === item.id}
                >
                  {item.labelRu}
                </button>
              ))}
            </div>
            {errors.element ? <span className={styles.error}>{errors.element.message}</span> : null}
          </fieldset>

          <label className={styles.checkbox}>
            <input type="checkbox" {...register("parentNoteRead")} />
            <span>Взрослый прочитал: наша роль — радоваться вместе, пропуски — не проблема</span>
          </label>
          {errors.parentNoteRead ? (
            <span className={styles.error}>{errors.parentNoteRead.message}</span>
          ) : null}

          <Button type="submit">Начать путь</Button>
        </form>
        {saved ? <p className={styles.saved}>Готово. Мир ждёт, {today()}.</p> : null}
      </Panel>
    </main>
  );
};
