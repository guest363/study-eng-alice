# Хранители Слов (рабочее название)

Тренажёр английского языка для Алисы в мире Genshin Impact: Тейват накрыло Великое
Безмолвие, и каждое выученное слово возвращает миру голос.

**Фан-проект для семейного использования.** Не связан с HoYoverse; публикация репозитория
и распространение сборки не предполагаются.

- Продуктовое ТЗ и план разработки по гейтам — [task.md](./task.md)
- Правила для агентов-разработчиков — [agent.md](./agent.md)
- Исследования по методикам — [research/](./research/)

## Быстрый старт

Требуется Node ≥ 22. Пакетный менеджер — Yarn 4 через corepack.

```bash
corepack enable
yarn
yarn dev:web          # приложение: http://localhost:5173
yarn lint             # biome check по всему репо
yarn typecheck        # turbo: tsc во всех пакетах
yarn test             # vitest во всех пакетах
yarn build            # сборка apps/web в dist/
```

Монорепо: `apps/web` (Vite SPA) + `packages/{core,db,media,content,ui}` — карта и правила
направления зависимостей в [agent.md](./agent.md).
