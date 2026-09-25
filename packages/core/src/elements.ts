/**
 * Семь стихий Тейвата — сквозные навыки тренажёра (task.md §4.2).
 *
 * Стихия — структурная единица движка: реакции (RF-7) и ротация заданий строятся
 * на id, подписи в UI может переопределять контент.
 */
export const ELEMENT_IDS = ["pyro", "hydro", "anemo", "geo", "electro", "dendro", "cryo"] as const;

export type ElementId = (typeof ELEMENT_IDS)[number];

export type ElementMeta = {
  readonly id: ElementId;
  readonly labelRu: string;
};

export const ELEMENTS: readonly ElementMeta[] = [
  { id: "pyro", labelRu: "Пиро" },
  { id: "hydro", labelRu: "Гидро" },
  { id: "anemo", labelRu: "Анемо" },
  { id: "geo", labelRu: "Гео" },
  { id: "electro", labelRu: "Электро" },
  { id: "dendro", labelRu: "Дендро" },
  { id: "cryo", labelRu: "Крио" },
];

/** Искры озарения — дневной лимит энергии путешественницы (task.md §4.5). */
export const DAILY_SPARKS_CAP = 40;

/** Стоимость одного поручения дня в искрах. */
export const SPARKS_PER_TASK = 10;
