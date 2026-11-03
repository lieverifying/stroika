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

## Макет (точные размеры, одинаковые для Canva и генератора)
**1:1 (1080×1080):**
- фото 0–670 px, без затемнения; логотип в левом верхнем углу фото;
- графитовая полоса `#1E2124` 670–1080 px, поля 56 px;
- заголовок 62 px, до 2 строк, слева; справа от него кнопка «Написати нам» в одну строку, высота 92 px;
- под заголовком два залитых чипа (фон `#2B3035`, текст `#F1F1EE` 34 px, без обводки); у «Лише в Черкасах» значок метки.

В ленте Meta сама ставит под картинкой кнопку «Надіслати повідомлення», поэтому на квадрате кнопка короткая и одинаковая. Длинные кнопки с глаголом — на вертикальных.

**9:16 (1080×1920):**
- фото 0–1000 px; логотип на высоте 300–380 px;
- графит 1000–1920 px; текстовый блок 1040–1500 px, поля 64 px;
- заголовок 84 px, чипы 38 px, кнопка 112 px высотой, текст 42 px в одну строку;
- выше 270 px только фото, ниже 1540 px ничего: там строка ответа Stories.

**Размерная линия:** на всех баннерах тонкая линия по ширине мебели, без цифр. Цифра только на C: вертикальная линия вдоль высокого шкафа справа с подписью «2700 мм». Это высота, как на сайте, а не ширина кухни.

## 10 баннеров: 5 тем, у каждой 1:1 и 9:16
В Ads Manager обе версии темы — одно объявление с разными плейсментами: 1:1 для ленты, 9:16 для Stories и Reels.

| Тема | Заголовок | Чип | Кнопка 9:16 | Фото 1:1 | Фото 9:16 |
|---|---|---|---|---|---|
| A. Есть проект ★ | Є дизайн-проєкт кухні? | Ціна за вашим проєктом | Надіслати проєкт | kukhnia-06 | kukhnia-10 |
| B. Известен бюджет ★ | Знаєте бюджет на кухню? | Обговоримо варіанти | Написати суму | kukhnia-01 | kukhnia-13 |
| C. Бесплатный замер ★ | Кухня точно під ваш розмір | Замір і проєкт безкоштовно | Записатись на замір | kukhnia-05 | kukhnia-05 |
| D. Шкаф | Шафа точно під вашу нішу | Замір і проєкт безкоштовно | Записатись на замір | shafa-01 | shafa-01 |
| E. ТВ-зона | ТВ-зона по вашій стіні | Замір і проєкт безкоштовно | Отримати проєкт | tv-zona-01 | tv-zona-01 |

Второй чип на всех баннерах — «Лише в Черкасах» со значком метки. Кнопка на всех квадратах — «Написати нам».

★ — стартовый набор: A, B, C. D и E — вторым этапом. Не брать `kukhnia-02`, `-03`, `-08`, `-11` и `shafa-03`: в кадре мрамор крупным планом, белое на белом, блики, обеденный стол, мягкая стеновая панель.

## Текст объявления в Ads Manager
- **Основной текст:** Кухні, шафи й корпусні меблі на замовлення — лише в Черкасах. Замір і дизайн-проєкт безкоштовно. Спершу цифра, рішення за вами. Напишіть нам у Messenger.
- **Заголовок:** Корпусні меблі в Черкасах

## Промты (каждый копируется целиком)
Прикладывайте полный файл фото, не `-480` и не `-960`. После генерации сравните мебель с оригиналом и проверьте каждую букву.

### A · 1:1 — фото `kukhni/kukhnia-06.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style. Top 62% (0-670 px): the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles, lights or appliances. No people, no hands, no extra objects. Bottom 38% (670-1080 px): flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam between photo and band: one thin white horizontal line with small end ticks spanning only the furniture width, no label. Inside the band, 56 px side margins: headline "Є дизайн-проєкт кухні?" in white geometric sans (like Unbounded), medium weight 500, 62 px, max 2 lines, left-aligned, max width 680 px. To the right of the headline, vertically centered with it: one rounded button, radius 10 px, height 92 px, solid #E3B12C, graphite #1E2124 text "Написати нам" 34 px on ONE line, horizontal padding 40 px. Below the headline, one row of two filled pills, height 64 px, radius 32 px, fill #2B3035, no outline, text #F1F1EE 34 px semibold sans (like Manrope): first pill "Ціна за вашим проєктом", second pill with a small location-pin icon "Лише в Черкасах". Top-left corner of the photo left empty (about 300x90 px) for a logo. Exact Ukrainian spelling with і, ї, є and apostrophes. No other text, no prices, no stickers, no shadows, no gradients.
```

### A · 9:16 — фото `kukhni/kukhnia-10.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories ad, calm premium editorial style. Top 52% (0-1000 px): the attached photograph, crop only, furniture pixel-faithful and unchanged, no people, no extra objects. Bottom 48% (1000-1920 px): flat solid graphite #1E2124, no gradient. On the seam between photo and band: one thin white horizontal line with small end ticks spanning only the furniture width, no label. Text block between 1040 px and 1500 px, 64 px side margins, left-aligned: headline "Є дизайн-проєкт кухні?" in white geometric sans (like Unbounded), medium weight 500, 84 px, max 2 lines; below it a row of two filled pills, height 72 px, radius 36 px, fill #2B3035, no outline, text #F1F1EE 38 px semibold sans (like Manrope): "Ціна за вашим проєктом" and, with a small location-pin icon, "Лише в Черкасах"; below them a rounded button, radius 10 px, height 112 px, solid #E3B12C, graphite #1E2124 text "Надіслати проєкт" 42 px on ONE line, horizontal padding 56 px. Nothing above 270 px except the photo, nothing below 1540 px (Stories reply bar zone). Empty space at 300-380 px height top-left for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no prices, no stickers, no shadows.
```

### B · 1:1 — фото `kukhni/kukhnia-01.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style. Top 62% (0-670 px): the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles, lights or appliances. No people, no hands, no extra objects. Bottom 38% (670-1080 px): flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam between photo and band: one thin white horizontal line with small end ticks spanning only the furniture width, no label. Inside the band, 56 px side margins: headline "Знаєте бюджет на кухню?" in white geometric sans (like Unbounded), medium weight 500, 62 px, max 2 lines, left-aligned, max width 680 px. To the right of the headline, vertically centered with it: one rounded button, radius 10 px, height 92 px, solid #E3B12C, graphite #1E2124 text "Написати нам" 34 px on ONE line, horizontal padding 40 px. Below the headline, one row of two filled pills, height 64 px, radius 32 px, fill #2B3035, no outline, text #F1F1EE 34 px semibold sans (like Manrope): first pill "Обговоримо варіанти", second pill with a small location-pin icon "Лише в Черкасах". Top-left corner of the photo left empty (about 300x90 px) for a logo. Exact Ukrainian spelling with і, ї, є and apostrophes. No other text, no prices, no stickers, no shadows, no gradients.
```

### B · 9:16 — фото `kukhni/kukhnia-13.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories ad, calm premium editorial style. Top 52% (0-1000 px): the attached photograph, crop only, furniture pixel-faithful and unchanged, no people, no extra objects. Bottom 48% (1000-1920 px): flat solid graphite #1E2124, no gradient. On the seam between photo and band: one thin white horizontal line with small end ticks spanning only the furniture width, no label. Text block between 1040 px and 1500 px, 64 px side margins, left-aligned: headline "Знаєте бюджет на кухню?" in white geometric sans (like Unbounded), medium weight 500, 84 px, max 2 lines; below it a row of two filled pills, height 72 px, radius 36 px, fill #2B3035, no outline, text #F1F1EE 38 px semibold sans (like Manrope): "Обговоримо варіанти" and, with a small location-pin icon, "Лише в Черкасах"; below them a rounded button, radius 10 px, height 112 px, solid #E3B12C, graphite #1E2124 text "Написати суму" 42 px on ONE line, horizontal padding 56 px. Nothing above 270 px except the photo, nothing below 1540 px (Stories reply bar zone). Empty space at 300-380 px height top-left for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no prices, no stickers, no shadows.
```

### C · 1:1 — фото `kukhni/kukhnia-05.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style. Top 62% (0-670 px): the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles, lights or appliances. No people, no hands, no extra objects. Bottom 38% (670-1080 px): flat solid graphite #1E2124 band, no gradient, no glow, no texture. Along the full height of the tall right-hand cabinet column, from floor to its top edge: one thin white vertical dimension line with small end ticks and a small monospace label "2700 мм" next to it. No horizontal label on the seam. Inside the band, 56 px side margins: headline "Кухня точно під ваш розмір" in white geometric sans (like Unbounded), medium weight 500, 62 px, max 2 lines, left-aligned, max width 680 px. To the right of the headline, vertically centered with it: one rounded button, radius 10 px, height 92 px, solid #E3B12C, graphite #1E2124 text "Написати нам" 34 px on ONE line, horizontal padding 40 px. Below the headline, one row of two filled pills, height 64 px, radius 32 px, fill #2B3035, no outline, text #F1F1EE 34 px semibold sans (like Manrope): first pill "Замір і проєкт безкоштовно", second pill with a small location-pin icon "Лише в Черкасах". Top-left corner of the photo left empty (about 300x90 px) for a logo. Exact Ukrainian spelling with і, ї, є and apostrophes. No other text, no prices, no stickers, no shadows, no gradients.
```

### C · 9:16 — фото `kukhni/kukhnia-05.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories ad, calm premium editorial style. Top 52% (0-1000 px): the attached photograph, crop only, furniture pixel-faithful and unchanged, no people, no extra objects. Bottom 48% (1000-1920 px): flat solid graphite #1E2124, no gradient. Along the full height of the tall right-hand cabinet column, from floor to its top edge: one thin white vertical dimension line with small end ticks and a small monospace label "2700 мм" next to it. No horizontal label on the seam. Text block between 1040 px and 1500 px, 64 px side margins, left-aligned: headline "Кухня точно під ваш розмір" in white geometric sans (like Unbounded), medium weight 500, 84 px, max 2 lines; below it a row of two filled pills, height 72 px, radius 36 px, fill #2B3035, no outline, text #F1F1EE 38 px semibold sans (like Manrope): "Замір і проєкт безкоштовно" and, with a small location-pin icon, "Лише в Черкасах"; below them a rounded button, radius 10 px, height 112 px, solid #E3B12C, graphite #1E2124 text "Записатись на замір" 42 px on ONE line, horizontal padding 56 px. Nothing above 270 px except the photo, nothing below 1540 px (Stories reply bar zone). Empty space at 300-380 px height top-left for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no prices, no stickers, no shadows.
```

### D · 1:1 — фото `shafy/shafa-01.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style. Top 62% (0-670 px): the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles, lights or appliances. No people, no hands, no extra objects. Bottom 38% (670-1080 px): flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam between photo and band: one thin white horizontal line with small end ticks spanning only the furniture width, no label. Inside the band, 56 px side margins: headline "Шафа точно під вашу нішу" in white geometric sans (like Unbounded), medium weight 500, 62 px, max 2 lines, left-aligned, max width 680 px. To the right of the headline, vertically centered with it: one rounded button, radius 10 px, height 92 px, solid #E3B12C, graphite #1E2124 text "Написати нам" 34 px on ONE line, horizontal padding 40 px. Below the headline, one row of two filled pills, height 64 px, radius 32 px, fill #2B3035, no outline, text #F1F1EE 34 px semibold sans (like Manrope): first pill "Замір і проєкт безкоштовно", second pill with a small location-pin icon "Лише в Черкасах". Top-left corner of the photo left empty (about 300x90 px) for a logo. Exact Ukrainian spelling with і, ї, є and apostrophes. No other text, no prices, no stickers, no shadows, no gradients.
```

### D · 9:16 — фото `shafy/shafa-01.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories ad, calm premium editorial style. Top 52% (0-1000 px): the attached photograph, crop only, furniture pixel-faithful and unchanged, no people, no extra objects. Bottom 48% (1000-1920 px): flat solid graphite #1E2124, no gradient. On the seam between photo and band: one thin white horizontal line with small end ticks spanning only the furniture width, no label. Text block between 1040 px and 1500 px, 64 px side margins, left-aligned: headline "Шафа точно під вашу нішу" in white geometric sans (like Unbounded), medium weight 500, 84 px, max 2 lines; below it a row of two filled pills, height 72 px, radius 36 px, fill #2B3035, no outline, text #F1F1EE 38 px semibold sans (like Manrope): "Замір і проєкт безкоштовно" and, with a small location-pin icon, "Лише в Черкасах"; below them a rounded button, radius 10 px, height 112 px, solid #E3B12C, graphite #1E2124 text "Записатись на замір" 42 px on ONE line, horizontal padding 56 px. Nothing above 270 px except the photo, nothing below 1540 px (Stories reply bar zone). Empty space at 300-380 px height top-left for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no prices, no stickers, no shadows.
```

### E · 1:1 — фото `inshi/tv-zona-01.webp`
```text
Square 1:1 (1080x1080) Facebook feed ad, calm premium editorial style. Top 62% (0-670 px): the attached photograph, used exactly as is, crop only. Do not redraw, restyle, add, remove or move any furniture, handles, lights or appliances. No people, no hands, no extra objects. Bottom 38% (670-1080 px): flat solid graphite #1E2124 band, no gradient, no glow, no texture. On the seam between photo and band: one thin white horizontal line with small end ticks spanning only the furniture width, no label. Inside the band, 56 px side margins: headline "ТВ-зона по вашій стіні" in white geometric sans (like Unbounded), medium weight 500, 62 px, max 2 lines, left-aligned, max width 680 px. To the right of the headline, vertically centered with it: one rounded button, radius 10 px, height 92 px, solid #E3B12C, graphite #1E2124 text "Написати нам" 34 px on ONE line, horizontal padding 40 px. Below the headline, one row of two filled pills, height 64 px, radius 32 px, fill #2B3035, no outline, text #F1F1EE 34 px semibold sans (like Manrope): first pill "Замір і проєкт безкоштовно", second pill with a small location-pin icon "Лише в Черкасах". Top-left corner of the photo left empty (about 300x90 px) for a logo. Exact Ukrainian spelling with і, ї, є and apostrophes. No other text, no prices, no stickers, no shadows, no gradients.
```

### E · 9:16 — фото `inshi/tv-zona-01.webp`
```text
Vertical 9:16 (1080x1920) Instagram Stories ad, calm premium editorial style. Top 52% (0-1000 px): the attached photograph, crop only, furniture pixel-faithful and unchanged, no people, no extra objects. Bottom 48% (1000-1920 px): flat solid graphite #1E2124, no gradient. On the seam between photo and band: one thin white horizontal line with small end ticks spanning only the furniture width, no label. Text block between 1040 px and 1500 px, 64 px side margins, left-aligned: headline "ТВ-зона по вашій стіні" in white geometric sans (like Unbounded), medium weight 500, 84 px, max 2 lines; below it a row of two filled pills, height 72 px, radius 36 px, fill #2B3035, no outline, text #F1F1EE 38 px semibold sans (like Manrope): "Замір і проєкт безкоштовно" and, with a small location-pin icon, "Лише в Черкасах"; below them a rounded button, radius 10 px, height 112 px, solid #E3B12C, graphite #1E2124 text "Отримати проєкт" 42 px on ONE line, horizontal padding 56 px. Nothing above 270 px except the photo, nothing below 1540 px (Stories reply bar zone). Empty space at 300-380 px height top-left for a logo. Exact Ukrainian spelling with і, ї, є. No other text, no prices, no stickers, no shadows.
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
