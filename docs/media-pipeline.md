# Медиа-пайплайн

## Принципы

1. Код ссылается только на **ключи** манифестов — никогда на пути файлов (agent.md, правило 8).
2. Манифесты: `packages/content/src/media.manifest.json` (глобальный: портреты, фоны)
   и `packages/content/src/regions/<slug>/media.manifest.json` (иконки слов региона).
3. `file: null` — арта нет: рантайм рисует SVG-заглушку в палитре стихии (не блокирует разработку).

## Импорт

```bash
yarn workspace @tw/content media:import                 # vibe3 по умолчанию: ../alice-vibe-3
yarn workspace @tw/content media:import --vibe3 /путь   # другой источник
```

Скрипт для каждого ключа с `file: null`:

1. Ищет `packages/content/media/inbox/<ключ>.{png,webp,jpg,jpeg}` — сюда кладутся
   сгенерированные в Nano Banana арты (промпт-шаблоны — task.md, Приложение Б).
2. Иначе — в `public/media` alice-vibe-3 по подсказке `vibe3: "<slug>/<имя-без-расширения>"`.
3. Копирует в `apps/web/public/media/<ключ>.<ext>` и вписывает в манифест
   `file: "media/<ключ>.<ext>"`, `source: "inbox" | "vibe3"`.

## Как добавить новый арт

1. Сгенерировать картинку (или взять из vibe-3) под нужный ключ.
2. Положить в `packages/content/media/inbox/<ключ>.png`.
3. `yarn workspace @tw/content media:import` — манифест обновится сам.
4. `yarn content:validate && yarn build` — убедиться, что ничего не сломалось.

## Правила ассетов

- Портреты персонажей — webp, желательно ≤400 КБ (сжатие добавить при превышении).
- Иконки слов — квадрат, без текста (стиль-префикс в task.md, Приложение Б).
- Никаких аудио/видео из alice-vibe-3 (mp4-демо скиллов не импортируются).
- Музыка Genshin запрещена: только CC0 или самозапись (task.md RF-10.3).
