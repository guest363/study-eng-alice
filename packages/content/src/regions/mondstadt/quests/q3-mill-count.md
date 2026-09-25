---
{
  "id": "mnd-q3-mill-count",
  "regionId": "mondstadt",
  "titleRu": "Урок счёта у мельницы",
  "kind": "commission",
  "element": "electro",
  "estimatedMinutes": 4,
  "cliffhangerRu": "Из кафе на площади потянуло утренним завтраком… Но это уже завтрашняя история!",
  "steps": [
    {
      "kind": "scene",
      "scene": {
        "id": "mnd-s-mill",
        "beats": [
          { "speakerId": "paimon", "textRu": "Мельник растерялся: он считает мешки зерна, а цифры безмолвствуют! Поможем?", "textEn": "How many?", "speakEn": true },
          { "speakerId": "narrator", "textRu": "Мешки выстроились в ряд. Слова-числа ждут, когда их назовут." }
        ]
      }
    },
    {
      "kind": "exercises",
      "titleRu": "Сосчитай, как Хранитель",
      "mentorId": "paimon",
      "items": [
        { "type": "quick-match", "wordIds": ["mnd-num-one", "mnd-num-two", "mnd-num-three", "mnd-num-four"] },
        { "type": "read-freeze", "wordId": "mnd-num-five", "mode": "pick" },
        { "type": "read-freeze", "wordId": "mnd-num-seven", "mode": "letters" }
      ]
    },
    { "kind": "reward", "chest": "common" }
  ]
}
---
Заметки редактора: числа 1–10 закрепляются матчингом и сборкой из букв.
Таймер запрещён (task.md §3.3): «молния» Электро — только украшение.
