---
{
  "id": "mnd-q4-amber-breakfast",
  "regionId": "mondstadt",
  "titleRu": "Завтрак Эмбер",
  "kind": "choice",
  "element": "pyro",
  "estimatedMinutes": 4,
  "cliffhangerRu": "Эмбер машет вслед: «Завтра — большой день! Песня рассвета ждёт!»",
  "steps": [
    {
      "kind": "scene",
      "scene": {
        "id": "mnd-s-breakfast",
        "beats": [
          { "speakerId": "amber", "textRu": "Доброе утро, Путешественница! Я жарю яйца на своей стихии — а слова на тарелках молчат! Wake up!", "textEn": "Good morning!", "speakEn": true },
          { "speakerId": "paimon", "textRu": "Назови каждое блюдо — и завтрак снова станет вкусным!" }
        ]
      }
    },
    {
      "kind": "exercises",
      "titleRu": "Собери завтрак из слов",
      "mentorId": "amber",
      "items": [
        { "type": "listen-pick", "wordId": "mnd-sound-egg", "distractorIds": ["mnd-sound-apple", "mnd-sound-fish"] },
        { "type": "say-back", "wordId": "mnd-greet-goodmorning" },
        { "type": "quick-match", "wordIds": ["mnd-sound-cat", "mnd-sound-dog", "mnd-sound-ball", "mnd-sound-book"] }
      ]
    },
    { "kind": "reward", "chest": "common" }
  ]
}
---
Заметки редактора: альтернативное поручение дня (второй вариант — «Песня ветра»).
Эмбер хвалит смелость, не скорость (task.md §3.3).
