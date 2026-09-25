---
{
  "id": "mnd-q1-library",
  "regionId": "mondstadt",
  "titleRu": "Спящие слова библиотеки",
  "kind": "commission",
  "element": "geo",
  "estimatedMinutes": 4,
  "cliffhangerRu": "Ноэлль шепчет: за высокими стеллажами кто-то тихо роняет буквы… Разгадаем завтра!",
  "steps": [
    {
      "kind": "scene",
      "scene": {
        "id": "mnd-s-library",
        "beats": [
          { "speakerId": "paimon", "textRu": "Смотри! Ноэлль нашла в библиотеке книгу, в которой слова спят прямо на строчках!", "textEn": "The words are sleeping!" },
          { "speakerId": "noelle", "textRu": "Путешественница, добрый день! Помогите разбудить их: назовите слово — и чернила засияют.", "textEn": "Wake up, words!", "speakEn": true },
          { "speakerId": "narrator", "textRu": "На большой странице дремлет слово в золотой рамке. Подойди ближе!" }
        ]
      }
    },
    {
      "kind": "exercises",
      "titleRu": "Разбуди слово из книги",
      "mentorId": "noelle",
      "items": [
        { "type": "listen-pick", "wordId": "mnd-sound-book", "distractorIds": ["mnd-sound-apple", "mnd-sound-ball"] },
        { "type": "say-back", "wordId": "mnd-me-myname" },
        { "type": "build-phrase", "wordId": "mnd-greet-thankyou" }
      ]
    },
    { "kind": "reward", "chest": "common" }
  ]
}
---
Заметки редактора: первое поручение региона. Ноэлль знакомится с Алисой
(my name is…) и учит благодарить (thank you). Реакция Кристаллизация (Гео)
ставит book под звезду памяти, если перед этим было задание Гео.
