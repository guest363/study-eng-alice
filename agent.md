# Хранители Слов — agent.md

Тренажёр английского для ребёнка 7–8 лет в мире Genshin Impact. Монорепо **Yarn 4 + Turbo**, React 19 / Vite 8 / TypeScript, CSS Modules, Biome (lint+format), lefthook. Полное ТЗ и план по гейтам — **`task.md`** (единственный источник продуктовых решений).

## Команды

```bash
yarn                                    # установка зависимостей
yarn dev                                # все dev-серверы через turbo (persistent)
yarn dev web                            # только приложение
yarn typecheck                          # turbo: typecheck всех пакетов
yarn lint                               # biome check
yarn test                               # vitest run
yarn build                              # turbo build (dependsOn ^build)
yarn content:validate                   # валидация контента Zod-схемами
node scripts/import-media.ts            # импорт/пережим ассетов (vibe-3 + inbox)
```

Охват проверок и порядок перед сдачей работы: `yarn typecheck && yarn lint && yarn test`. Не объявляй непройденные проверки успешными.

## Краткие правила (действуют всегда)

Полные обоснования — `task.md`, разделы 8–9. Нарушения недопустимы.

1. Файлы — kebab-case. Функции — только `const = () => {}`. Типы — `type`; `interface` — только для extends/merging. Именованные экспорты; `export default` запрещён (кроме `*.config.*`).
2. `any` и `as` запрещены — `unknown`, Zod, дженерики. `import type` обязателен. JSDoc и тексты ошибок Zod — на русском, грамотно, без рунглиша.
3. Стили — только CSS Modules (`*.module.css`) + каскадные слои `reset < base < tokens < utilities < ui-components < app-components`. Цвета — только токены из `tokens.css`, хардкод запрещён. Классы склеивать `cn()` из `@tw/ui`. **Tailwind запрещён.**
4. Компонент = `component-name.tsx` + `component-name.module.css` + `index.ts` в папке kebab-case. Inline-стили запрещены.
5. Побочные эффекты и I/O — вне компонентов: движки в `@tw/core` (чистый TS, без DOM и React), доступ к данным — репозитории `@tw/db`, звук — `@tw/media`. Никаких `fetch`/`speechSynthesis`/`indexedDB` в компонентах.
6. Асинхронное состояние — только TanStack Query поверх репозиториев Dexie: чтение `useQuery` с queryKey-фабриками, запись `useMutation` + `invalidateQueries`. Не дублировать прогресс в `useState`.
7. Контент — только данные в `packages/content` (md/json, валидируемые Zod на сборке). Слова курса, реплики Паймон, темы и сюжеты в коде запрещены. Вторые копии фактов запрещены — единственный источник правды.
8. Код не ссылается на пути ассетов напрямую — только ключи `media.manifest.json` (пайплайн `task.md` §6.3).
9. Новые зависимости — только с критическим поводом; велосипеды запрещены: `es-toolkit`, `mitt`, `dnd-kit`. Анимации — CSS + canvas (SVG-спарки как в alice-vibe-3), без анимационных библиотек.
10. **Детский UX — критические правила:** никаких оценок, красных крестов, звуков провала, таймеров, жизней, рандомных наград, лидербордов, внешних ссылок и аналитики. Ошибка = «почти» + подсказка (максимум 2) → показ ответа → слово в сад. Похвала — за процесс и приём. Сессия ≤15 минут, заканчивается успехом.
11. Хит-зоны ≥48px, `focus-visible` обводки, `prefers-reduced-motion` уважается, текст сворачивать (не обрезать «…»), кикер ≠ заголовок.
12. Turbo-кэш: у задач в `turbo.json` объявляй явные `inputs`/`outputs`; содержимое `packages/content` — вход для задач, зависящих от контента.

## Карта контекста

| Задача | Куда смотреть |
|---|---|
| Продуктовые решения, гейты, чеклисты | `task.md` |
| Педагогические обоснования | `research/*.md` (4 ресерча), `task.md` §3 |
| Дизайн-токены и атмосфера | `alice-vibe-3/src/styles/{base,tokens}.css`, `task.md` §9 |
| Конвенции компонент/монорепо | `task.md` §8, этот файл |
| Медиа-пайплайн (vibe-3 + Nano Banana) | `task.md` §6.3, Приложение Б, `docs/media-pipeline.md` |
| Контракты данных | `packages/core/src/contracts/` (Zod = типы) |
| Ассеты персонажей | `alice-vibe-3/public/media/` (импорт скриптом, не руками) |
| Протокол пилота с Алисой | `docs/pilot-protocol.md` (G9) |

## Структура репозитория

- `apps/web` — Vite SPA: страницы (`pages/`), компоненты (`components/`), провайдеры, стили.
- `packages/core` — чистый домен: контракты Zod, FSRS-lite, session-builder, exercise-engine, реакции, ранги. Без React, DOM и браузерных API.
- `packages/db` — Dexie схема (версионируется), репозитории, queryKey-фабрики.
- `packages/media` — TTS (speechSynthesis), плеер, MediaRecorder.
- `packages/content` — данные курса (md/json), парсер, валидация, манифесты медиа.
- `packages/ui` — геншин-кит: Button, Panel, DialogBox, ResinBar, ChestOverlay, RegionMap, ElementalAura.
- Направление зависимостей: `web → {ui, db, media, content, core} → core`. Циклы запрещены. Импорты — алиасами `@tw/*`.

## Известные ловушки (переняты у alice-vibe-3 + специфика проекта)

- `preserve-3d` на обёртках с ховером ломает hit-test (pointerleave-циклы) — обёртки держать плоскими.
- `speechSynthesis.getVoices()` асинхронен и пуст при старте — подписка на `voiceschanged`, выбор голоса в `@tw/media`, не в компонентах. Автовоспроизведение звука до первого тапа запрещено политикой браузеров.
- iOS Safari: `speechSynthesis` молчит вне пользовательского жеста; IndexedDB в приватном режиме может срезать квоты — логировать ёмкость, не молчать.
- dnd-kit: тач-сенсоры требуют `touch-action: none` на захватываемом элементе, иначе скролл съедает перетаскивание.
- Canvas-ауры на слабых планшетах — приглушать (`opacity ≤0.6`, меньше частиц), останавливать rAF на скрытых вкладках.
- Turbo кэширует агрессивно: «изменил контент, а сборка старая» = забыл `inputs` в `turbo.json`.
- GitHub Pages: SPA-роуты требуют 404-fallback (`cp dist/index.html dist/404.html`) и корректный `base` — иначе белый экран на вложенных маршрутах.

## Проверка визуала

Скриншоты python-playwright: desktop 1280×2000, iPad 820×1180, iPhone 390×844 — все новые экраны проверяются на трёх вьюпортах перед сдачей (протокол — `task.md` G8). Детский UI дополнительно проверять инспектором: hit-зоны, контраст, отсутствие мелкого текста в действиях.

## Сообщения коммитов

Conventional (как в kraken): `<type>(<scope>): <subject>` — типы `feat, fix, perf, docs, style, refactor, test, build`; scope = пакет без префикса (`web`, `core`, `content`…); первая строка ≤72 символов, императив; body с пустой строки. Коммиты — только по явной просьбе пользователя.

Дисклеймер проекта: фан-проект по Genshin Impact для семейного использования, не связан с HoYoverse; публикация репозитория и сборки запрещена (см. `task.md` §3.2).
