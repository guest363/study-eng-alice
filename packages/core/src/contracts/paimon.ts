/** Банк реплик Паймон — все тексты гидa только из контента (agent.md, правило 7). */
import { z } from "zod";

export const paimonBankSchema = z.object({
  dayOpen: z.array(z.string().min(1)).min(3, "Нужно минимум 3 реплики открытия дня"),
  praise: z.array(z.string().min(1)).min(6, "Нужно минимум 6 реплик похвалы"),
  almost: z.array(z.string().min(1)).min(4, "Нужно минимум 4 реплики «почти»"),
  hint: z.array(z.string().min(1)).min(4, "Нужно минимум 4 подсказки"),
  cliffhanger: z.array(z.string().min(1)).min(4, "Нужно минимум 4 клиффхэнгера"),
  rest: z.array(z.string().min(1)).min(3, "Нужно минимум 3 реплики отдыха"),
  garden: z.array(z.string().min(1)).min(2, "Нужно минимум 2 реплики сада"),
  chest: z.array(z.string().min(1)).min(2, "Нужно минимум 2 реплики сундука"),
  choice: z.array(z.string().min(1)).min(2, "Нужно минимум 2 реплики выбора"),
});

export type PaimonBank = z.infer<typeof paimonBankSchema>;
