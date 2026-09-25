---
{
  "id": "mnd-q2-wind-song",
  "regionId": "mondstadt",
  "titleRu": "Мелодия ветра",
  "kind": "commission",
  "element": "anemo",
  "estimatedMinutes": 4,
  "cliffhangerRu": "Лира Венти смолкла… а мельница за рекой будто хочет что-то сказать. До завтра!",
  "steps": [
    {
      "kind": "scene",
      "scene": {
        "id": "mnd-s-wind",
        "beats": [
          { "speakerId": "venti", "textRu": "Ты на вершине башни, Путешественница! Ветер принеси мне пару звуков — а я превращу их в песню.", "textEn": "Listen to the wind!", "speakEn": true },
          { "speakerId": "paimon", "textRu": "Повторяй за Венти медленно — он лучший бард Тейвата!" }
        ]
      }
    },
    {
      "kind": "exercises",
      "titleRu": "Спой со стихией ветра",
      "mentorId": "venti",
      "items": [
        { "type": "echo-sound", "wordId": "mnd-nat-wind", "focusSound": "w" },
        { "type": "echo-sound", "wordId": "mnd-nat-sky", "focusSound": "sk" },
        { "type": "listen-pick", "wordId": "mnd-sound-fish", "distractorIds": ["mnd-sound-cat", "mnd-sound-dog"] }
      ]
    },
    { "kind": "reward", "chest": "common" }
  ]
}
---
Заметки редактора: звук «sk» требует спокойного темпа — Венти поёт медленно (rate 0.7).
