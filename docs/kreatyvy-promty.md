# Баннеры «Вимір» для рекламы в Messenger

Обновлено 2026-11-03. Цель — переписка в Messenger с людьми из Черкасс, у которых есть проект или понятный бюджет.
Собрано из работы трёх агентов: стратегия, тексты, визуал. Договор в рекламе не упоминаем.

## Что изменилось по сравнению со старыми баннерами
- **Цена:** убрали «Назвемо орієнтовну ціну» без условия. Именно такая фраза приводила людей с вопросом «кухня 3 метри, скільки?». Теперь цена только «за вашим проєктом».
- **Выгода:** главная выгода теперь на баннере: бесплатные замер и дизайн-проєкт.
- **Город:** «Лише в Черкасах» вынесено в отдельный чип на каждом баннере. Звучит как факт, а не запрет.
- **Текст:** на баннере до 10 слов: заголовок до 5 слов, 2 чипа, кнопка с глаголом.
- **Макет:** фото сверху без затемнения, снизу ровная графитовая полоса. Текст не ложится на мебель, а баннер отличается от типичного «фото, градиент и жёлтая кнопка» у конкурентов.
- **Логотип:** полный логотип «ВИМІР» вместо одного знака на белом квадрате.

## Важно: как делать, чтобы мебель не исказилась
Генераторы изображений перерисовывают фото: меняют ручки, светильники и швы фасадов даже при прямом запрете. Кириллицу тоже путают (і, ї, є, апостроф).

**Надёжный способ (рекомендую):**
1. В Canva или Figma сделать два шаблона: 1080×1080 и 1080×1920 по макету ниже. Шрифты Unbounded и Manrope есть в Google Fonts.
2. Вставить оригинальное фото из `public/portfolio/img/`, полный файл, а не `-480`. Только обрезать.
3. Текст набрать в шаблоне из таблицы ниже, логотип взять из `public/brand/logo-dark.svg`.
4. Перед запуском проверить превью на телефоне в Ads Manager.

**Если всё же через генератор:** промты ниже, по одному на баннер. После генерации сравните мебель с оригиналом при увеличении и проверьте каждую букву.

## Макет
**1:1 (1080×1080):**
- верхние 66 % — фото без затемнения, логотип в левом верхнем углу;
- нижние 34 % — графит `#1E2124`;
- на стыке — тонкая размерная линия по ширине мебели;
- в полосе слева заголовок и чипы, справа кнопка.

**9:16 (1080×1920):**
- 0–50 % — фото, логотип на высоте 15–19 %;
- 50–100 % — графит, текст между 52 % и 64 %;
- выше 14 % и ниже 65 % — без текста: там интерфейс Stories и Reels.

**Правила:**
- заголовок Unbounded 500, не жирный;
- чипы Manrope 600, светло-серые;
- жёлтый `#E3B12C` — только кнопка;
- подпись в мм у размерной линии — только реальная. Подтверждена одна: 2700 мм для `kukhnia-05`. На остальных баннерах линия без цифр.

## 10 баннеров: 5 тем, у каждой 1:1 и 9:16
В Ads Manager обе версии темы — одно объявление с разными плейсментами: 1:1 для ленты, 9:16 для Stories и Reels.

| Тема | Заголовок | Чипы | Кнопка | Фото 1:1 | Фото 9:16 |
|---|---|---|---|---|---|
| A. Есть проект ★ | Є дизайн-проєкт кухні? | Ціна за вашим проєктом · Лише в Черкасах | Надіслати проєкт | kukhnia-06 | kukhnia-10 |
| B. Известен бюджет ★ | Знаєте бюджет на кухню? | Обговоримо варіанти · Лише в Черкасах | Написати суму | kukhnia-01 | kukhnia-11 |
| C. Бесплатный замер ★ | Кухня точно під ваш розмір | Замір і проєкт безкоштовно · Лише в Черкасах | Записатись на замір | kukhnia-05 (2700 мм) | kukhnia-05 (2700 мм) |
| D. Шкаф или гардеробная | Шафа точно під вашу нішу | Замір і проєкт безкоштовно · Лише в Черкасах | Записатись на замір | shafa-01 | shafa-03 |
| E. ТВ-зона | ТВ-зона по вашій стіні | Замір і проєкт безкоштовно · Лише в Черкасах | Отримати проєкт | tv-zona-01 | tv-zona-01 |

★ — стартовый набор: A, B, C. D и E запускать вторым этапом. Фото `kukhnia-02`, `-03`, `-08` не брать: мрамор крупным планом, белое на белом, блики и стул в кадре.

## Текст объявления в Ads Manager
- **Основной текст:** Кухні, шафи й корпусні меблі на замовлення — лише в Черкасах. Замір і дизайн-проєкт безкоштовно. Спершу цифра, рішення за вами. Напишіть нам у Messenger.
- **Заголовок:** Корпусні меблі в Черкасах

## Промты (каждый копируется целиком)

### A · 1:1 — фото `kukhni/kukhnia-06.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style, lots of air. Top 66%: the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles, lights or appliances. No people, no hands. Bottom 34%: flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam: one thin white dimension line with end ticks spanning the furniture, no label. In the band, left-aligned, 6% margins: headline "Є дизайн-проєкт кухні?" in white geometric sans, medium weight, not bold; below it "Ціна за вашим проєктом · Лише в Черкасах" in small light-grey text. Right side of the band: one rounded button, radius 10px, solid #E3B12C, graphite text "Надіслати проєкт". Empty top-left corner of the photo for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no stickers, icons, shadows or gradients.
```

### A · 9:16 — фото `kukhni/kukhnia-10.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories/Reels ad, calm premium editorial style. Top 50%: the attached photograph, crop only, furniture pixel-faithful and unchanged, no people. Bottom 50%: flat solid graphite #1E2124, no gradient. On the seam: thin white dimension line with ticks, no label. Text block between 52% and 64% of height, left-aligned, 6% margins: headline "Є дизайн-проєкт кухні?" white geometric sans, medium weight; "Ціна за вашим проєктом · Лише в Черкасах" small light-grey; rounded button radius 10px, #E3B12C, graphite text "Надіслати проєкт". Keep the top 14% and everything below 65% free of text. Empty space at 15-19% height top-left for a logo. Exact Ukrainian spelling. Nothing else.
```

### B · 1:1 — фото `kukhni/kukhnia-01.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style, lots of air. Top 66%: the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles, lights or appliances. No people, no hands. Bottom 34%: flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam: one thin white dimension line with end ticks spanning the furniture, no label. In the band, left-aligned, 6% margins: headline "Знаєте бюджет на кухню?" in white geometric sans, medium weight, not bold; below it "Обговоримо варіанти · Лише в Черкасах" in small light-grey text. Right side of the band: one rounded button, radius 10px, solid #E3B12C, graphite text "Написати суму". Empty top-left corner of the photo for a logo. Exact Ukrainian spelling with і, ї, є. No prices, no other text, no stickers, icons, shadows or gradients.
```

### B · 9:16 — фото `kukhni/kukhnia-11.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories/Reels ad, calm premium editorial style. Top 50%: the attached photograph, crop only, furniture pixel-faithful and unchanged, no people. Bottom 50%: flat solid graphite #1E2124, no gradient. On the seam: thin white dimension line with ticks, no label. Text block between 52% and 64% of height, left-aligned, 6% margins: headline "Знаєте бюджет на кухню?" white geometric sans, medium weight; "Обговоримо варіанти · Лише в Черкасах" small light-grey; rounded button radius 10px, #E3B12C, graphite text "Написати суму". Keep the top 14% and everything below 65% free of text. Empty space at 15-19% height top-left for a logo. Exact Ukrainian spelling. No prices. Nothing else.
```

### C · 1:1 — фото `kukhni/kukhnia-05.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style, lots of air. Top 66%: the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles, lights or appliances. No people, no hands. Bottom 34%: flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam: one thin white dimension line with end ticks spanning the furniture, small monospace label "2700 мм". In the band, left-aligned, 6% margins: headline "Кухня точно під ваш розмір" in white geometric sans, medium weight, not bold; below it "Замір і проєкт безкоштовно · Лише в Черкасах" in small light-grey text. Right side of the band: one rounded button, radius 10px, solid #E3B12C, graphite text "Записатись на замір". Empty top-left corner of the photo for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no stickers, icons, shadows or gradients.
```

### C · 9:16 — фото `kukhni/kukhnia-05.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories/Reels ad, calm premium editorial style. Top 50%: the attached photograph, crop only, furniture pixel-faithful and unchanged, no people. Bottom 50%: flat solid graphite #1E2124, no gradient. On the seam: thin white dimension line with ticks, monospace label "2700 мм". Text block between 52% and 64% of height, left-aligned, 6% margins: headline "Кухня точно під ваш розмір" white geometric sans, medium weight; "Замір і проєкт безкоштовно · Лише в Черкасах" small light-grey; rounded button radius 10px, #E3B12C, graphite text "Записатись на замір". Keep the top 14% and everything below 65% free of text. Empty space at 15-19% height top-left for a logo. Exact Ukrainian spelling. Nothing else.
```

### D · 1:1 — фото `shafy/shafa-01.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style, lots of air. Top 66%: the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles or doors. No people, no hands. Bottom 34%: flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam: one thin white dimension line with end ticks spanning the wardrobe, no label. In the band, left-aligned, 6% margins: headline "Шафа точно під вашу нішу" in white geometric sans, medium weight, not bold; below it "Замір і проєкт безкоштовно · Лише в Черкасах" in small light-grey text. Right side of the band: one rounded button, radius 10px, solid #E3B12C, graphite text "Записатись на замір". Empty top-left corner of the photo for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no stickers, icons, shadows or gradients.
```

### D · 9:16 — фото `shafy/shafa-03.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories/Reels ad, calm premium editorial style. Top 50%: the attached photograph, crop only, furniture pixel-faithful and unchanged, no people. Bottom 50%: flat solid graphite #1E2124, no gradient. On the seam: thin white dimension line with ticks, no label. Text block between 52% and 64% of height, left-aligned, 6% margins: headline "Шафа точно під вашу нішу" white geometric sans, medium weight; "Замір і проєкт безкоштовно · Лише в Черкасах" small light-grey; rounded button radius 10px, #E3B12C, graphite text "Записатись на замір". Keep the top 14% and everything below 65% free of text. Empty space at 15-19% height top-left for a logo. Exact Ukrainian spelling. Nothing else.
```

### E · 1:1 — фото `inshi/tv-zona-01.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style, lots of air. Top 66%: the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, panels, lights or the TV. No people, no hands. Bottom 34%: flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam: one thin white dimension line with end ticks spanning the wall, no label. In the band, left-aligned, 6% margins: headline "ТВ-зона по вашій стіні" in white geometric sans, medium weight, not bold; below it "Замір і проєкт безкоштовно · Лише в Черкасах" in small light-grey text. Right side of the band: one rounded button, radius 10px, solid #E3B12C, graphite text "Отримати проєкт". Empty top-left corner of the photo for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no stickers, icons, shadows or gradients.
```

### E · 9:16 — фото `inshi/tv-zona-01.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories/Reels ad, calm premium editorial style. Top 50%: the attached photograph, crop only, furniture pixel-faithful and unchanged, no people. Bottom 50%: flat solid graphite #1E2124, no gradient. On the seam: thin white dimension line with ticks, no label. Text block between 52% and 64% of height, left-aligned, 6% margins: headline "ТВ-зона по вашій стіні" white geometric sans, medium weight; "Замір і проєкт безкоштовно · Лише в Черкасах" small light-grey; rounded button radius 10px, #E3B12C, graphite text "Отримати проєкт". Keep the top 14% and everything below 65% free of text. Empty space at 15-19% height top-left for a logo. Exact Ukrainian spelling. Nothing else.
```

## Настройка в Ads Manager
- **Цель:** «Взаимодействие» (Engagement), место конверсии — Messenger, оптимизация — разговоры. Не «Трафик»: он покупает клики, а не переписки.
- **Гео:** город Черкассы без радиуса на область, вариант «живут в этом месте», а не «недавно были». Исключить Золотоношу, Умань, Христинівку.
- **Аудитория:** без сужения интересами, город и так маленький. Audience Network выключить.
- **Структура:** одна кампания и одна группа объявлений, в ней темы A, B и C. Бюджет не дробить.
- **Тесты по очереди, по одному фактору:** сначала заголовок (A, B, C), потом продукт (кухня, шкаф), потом фото.
- **Как оценивать:** не по цене разговора, а по цене квалифицированного разговора: человек из Черкасс и у него есть проект или бюджет. Помечайте переписки тегами во «Входящих». Пороги отключения — по первым данным.
- **Показы:** если отвечать некому ночью, включите расписание показов (нужен бюджет на весь срок).

## Messenger: приветствие и вопросы
**Приветствие:** Вітаємо у «Вимір». Кухні та шафи на замовлення. Працюємо лише в Черкасах. Що вас цікавить?

**Быстрые кнопки:** Кухня · Шафа або гардеробна · ТВ-зона чи інші меблі · У мене вже є проєкт

**Вопросы по порядку:**
1. Ви з Черкас? Напишіть, будь ласка, район.
2. Що саме потрібно і чи є проєкт? Можна просто надіслати його файлом.
3. На який бюджет орієнтуєтесь? Можна приблизно цифрою або «ще не знаю».

**Если не из Черкасс:** Дякуємо за інтерес. Поки що працюємо лише в Черкасах, тож замір і монтаж в іншому місті зробити не можемо.

**На «яка ціна?»:** Ціну за одним розміром назвати не можемо: вона залежить від матеріалів і наповнення, вийде вгадування. Орієнтовну ціну назвемо за готовим проєктом з матеріалами. Замір і проєкт у Черкасах безкоштовні. Є проєкт — надішліть. Немає — запишемо на замір. Ви з Черкас і який у вас бюджет?

**Нужно поправить в текущих автоответах:** там есть слово «Менеджер». Замените на «Ми зв'яжемося з вами».

## Скорость ответа
- Мгновенный автоответ на приветствие и сохранённые ответы на частые вопросы.
- Часы работы в настройках страницы и сообщение вне часов: «Відповімо у робочий час». Конкретные минуты не обещать.
- Уведомления Meta Business Suite на телефон одного ответственного, второй человек на подмену.
- Отвечать в пределах 24 часов после последнего сообщения клиента: потом Meta ограничивает ответы.
