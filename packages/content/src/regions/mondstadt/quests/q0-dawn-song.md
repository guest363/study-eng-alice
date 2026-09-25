---
{
  "id": "mnd-q0-dawn-song",
  "regionId": "mondstadt",
  "titleRu": "Песня рассвета — архонтский квест",
  "kind": "archon",
  "element": "anemo",
  "estimatedMinutes": 12,
  "cliffhangerRu": "Ветер принёс запах специй с востока… Дорога ведёт в Ли Юэ, город рынка!",
  "steps": [
    {
      "kind": "scene",
      "scene": {
        "id": "mnd-s-dawn-1",
        "beats": [
          { "speakerId": "narrator", "textRu": "Когда-то каждое утро Мондштадта начиналось с песни ветра. Потом пришло Великое Безмолвие — и рассветы стали немыми." },
          { "speakerId": "paimon", "textRu": "Паймон помнит эту песню! Она начиналась со слов «good morning»… но слова уснули." }
        ]
      }
    },
    {
      "kind": "scene",
      "scene": {
        "id": "mnd-s-dawn-2",
        "beats": [
          { "speakerId": "noelle", "textRu": "Я собрала все буквы на площади — вы их расставите по местам. Вентилиров песня не начнётся без вас!", "textEn": "Let's wake up the sun!", "speakEn": true }
        ]
      }
    },
    {
      "kind": "exercises",
      "titleRu": "Верни Мондштадту рассвет",
      "mentorId": "venti",
      "items": [
        { "type": "build-phrase", "wordId": "mnd-greet-goodmorning" },
        { "type": "echo-sound", "wordId": "mnd-nat-day", "focusSound": "d" },
        { "type": "listen-pick", "wordId": "mnd-nat-night", "distractorIds": ["mnd-nat-sun", "mnd-nat-sky"] },
        { "type": "read-freeze", "wordId": "mnd-nat-sun", "mode": "letters" }
      ]
    },
    {
      "kind": "scene",
      "scene": {
        "id": "mnd-s-dawn-3",
        "beats": [
          { "speakerId": "narrator", "textRu": "Ветер поднял над башней золотые буквы — и город вдохнул. Песня рассвета вернулась!" },
          { "speakerId": "venti", "textRu": "Слушай: the sun is up! Ты вернула Мондштадту голос, Хранительница. Ветер запомнит это.", "textEn": "The sun is up!", "speakEn": true }
        ]
      }
    },
    {
      "kind": "retell",
      "titleRu": "Расскажи Паймон, как вернулся рассвет",
      "sceneIds": ["mnd-s-dawn-1", "mnd-s-dawn-2", "mnd-s-dawn-3"]
    },
    { "kind": "reward", "chest": "precious" }
  ]
}
---
Заметки редактора: финал региона. Пересказ — пассивная форма (порядок карточек).
Награда: драгоценный сундук + Ноэлль присоединяется к отряду (событие G6).
