# PLAN.md — сайт «ВИМІР»: задачи фаз 2–4

Статус: фаза 1, черновик. Ждёт подтверждения владельца вместе с `docs/ARCHITECTURE.md`.
Источники: `CLAUDE.md` (главный), `docs/TZ.md`, `docs/PHASES.md`, `docs/ARCHITECTURE.md` (структура папок, имена файлов, модели данных и токены берутся оттуда).
Фазы 5–9 расписываются после получения фактов от владельца.

---

## 0. Правила работы по плану

1. **Одна фаза за раз.** Задачи фазы N+1 не начинаются, пока владелец не прошёл контрольную точку фазы N. Принятое не переписываем: правка принятого — отдельная задача с обоснованием.
2. **Без выдуманных фактов.** Цены, сроки, гарантия, цифры, имена, отзывы, бренды, контакты — только заглушки `{{...}}` из `src/content/facts.ts` (таблица в ARCHITECTURE.md, 5.2). Новая заглушка сначала добавляется в `facts.ts`, потом используется.
3. **Запрещённое слово из CLAUDE.md, п.3** не появляется нигде: ни в коде, ни в текстах, ни в коммитах. Проверяет `scripts/check-words.mjs` при каждой сборке.
4. **Никаких стоковых фото.** Только `PlaceholderImage` (серый блок с подписью размера).
5. **Мобильный первым.** Каждый блок верстаем сначала на 375 px, потом 768 и 1280 px. Дополнительно смотрим 320 px.
6. **После каждой задачи** коммит с сообщением на русском (указано в задаче) и `git push`.
7. Текст сайта украинский, комментарии в коде и документация русские.

### Общее Definition of Done (для каждой задачи)

- `npm run build` проходит без ошибок и предупреждений (в `build` входят `astro check` и `check-words`).
- Скриншоты 375 и 1280 px лежат в `docs/screens/`. Имена: `<фаза>-<задача>-<что>-<ширина>.png`, например `2-16-styleguide-375.png`. Делаются командой `npm run screens` (задача 2.5).
- Нет горизонтального скролла на 375 и 1280 px (с задачи 2.5 проверяет `tests/e2e/layout.spec.ts`).
- Нет выдуманных фактов, нет запрещённого слова.
- Читаемый текст на телефоне ≥ 16 px, кнопки ≥ 48 px, текст на жёлтом графитовый.
- Коммит сделан и запушен.

### Суммарная оценка

| Фаза | Задач | Оценка |
|---|---|---|
| 2 — Дизайн-система | 17 | 1050 мин ≈ 17,5 ч |
| 3 — Главная на заглушках | 16 | 1185 мин ≈ 19,8 ч |
| 4 — Квиз (интерфейс) | 11 | 810 мин ≈ 13,5 ч |
| **Итого** | **44** | **≈ 51 ч** без времени на ожидание ревью владельца |

---

## Фаза 2 — Дизайн-система

Цель: `/styleguide` показывает все базовые компоненты на 375 и 1280 px, владелец их одобрил.

#### 2.1. Инициализация Astro + TS strict — 60 мин
- **Что:** проект Astro 5 (`output: 'static'`), Node 22, npm. `tsconfig` на пресете `astro/tsconfigs/strict`. `astro:env`: `SITE_URL` и `SITE_ENV` (`development` / `preview` / `production`), `site` в `astro.config.mjs` из `SITE_URL`. Скрипты: `dev`, `build` = `astro check && astro build`, `preview`. `.env.example` без значений. Дополнить `.gitignore` (`node_modules`, `dist`, `.astro`, `.env`, `test-results`, `playwright-report`). Временная `src/pages/index.astro` с одной строкой.
- **Файлы:** `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `.env.example`, `.gitignore`, `src/pages/index.astro`, `src/env.d.ts`.
- **Готово, когда:** `npm run build` без ошибок и предупреждений; `astro check` реально выполняется в `build` (намеренная ошибка типа роняет сборку, после проверки убрана); `npm run dev` открывает `/`.
- **Коммит:** `Фаза 2: инициализация Astro 5, TypeScript strict, astro check в сборке`

#### 2.2. Tailwind 4 и токены — 75 мин
- **Что:** `@tailwindcss/vite`. `src/styles/tokens.css` с `@theme` строго по ARCHITECTURE.md, раздел 6: цвета 6.1 (стандартная палитра отключена `--color-*: initial`), шкала шрифтов 6.4 через `clamp()`, отступы 6.5, контейнер и радиусы 6.6, тени, длительности, контролы 6.7, брейкпоинты 6.8 (`sm` и `2xl` отключены), z-index 6.10. `src/styles/global.css`: `@import "tailwindcss"`, токены, база (фон штукатурка, текст графит), `hyphens: auto` для абзацев, `text-wrap: balance` для заголовков, кольцо фокуса 2 px графит / штукатурка на тёмном, `prefers-reduced-motion`.
- **Файлы:** `src/styles/tokens.css`, `src/styles/global.css`, `astro.config.mjs`, `package.json`.
- **Готово, когда:** сборка чистая; класс с цветом вне палитры (например `bg-red-500`) не даёт стиля; на временной `/` видны фон `#F1F1EE` и текст `#1E2124`; контраст пар из 6.2 перепроверен инструментом, результат одной строкой в описании коммита.
- **Коммит:** `Фаза 2: Tailwind 4 и дизайн-токены в tokens.css`

#### 2.3. Шрифты — 60 мин
- **Что:** `@fontsource/unbounded` (600), `@fontsource-variable/manrope`, `@fontsource/jetbrains-mono` (500), только подмножества `cyrillic` и `latin`, `font-display: swap`. Preload только двух файлов: Manrope cyrillic и Unbounded cyrillic 600. Fallback-метрики (`size-adjust`, `ascent-override`) для Unbounded и Manrope. Роли `--font-display`, `--font-body`, `--font-mono` в `tokens.css`.
- **Файлы:** `src/styles/fonts.css` (или секция в `global.css`), `src/styles/tokens.css`, `package.json`.
- **Готово, когда:** на `/` строка «Ґанок, їжак, єнот, ІІ — 1234 грн» корректно отрисована всеми тремя шрифтами (і, ї, є, ґ, апостроф ʼ); в DevTools Network ровно 2 preload-шрифта, запросов к сторонним доменам нет; скриншоты `2-3-fonts-375.png`, `2-3-fonts-1280.png`.
- **Коммит:** `Фаза 2: self-host шрифтов Unbounded, Manrope, JetBrains Mono с кириллицей`

#### 2.4. BaseLayout — 45 мин
- **Что:** `<html lang="uk">`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` **без** `user-scalable=no` и `maximum-scale`. Слоты под Header, контент (`<main id="main">`), Footer, MobileBottomBar. `SkipLink` «Перейти до змісту». Пропсы `title`, `description`, `noindex`. При `SITE_ENV !== 'production'` всегда `noindex`. Подключение `global.css`, favicon.
- **Файлы:** `src/layouts/BaseLayout.astro`, `src/components/layout/SkipLink.astro`, `src/components/layout/SeoHead.astro` (минимальный: title, description, robots), `src/pages/index.astro`.
- **Готово, когда:** в HTML `/` есть `lang="uk"`, viewport ровно как выше, `noindex` в dev; skip-link появляется по Tab; масштабирование пальцем работает в эмуляции телефона.
- **Коммит:** `Фаза 2: базовый layout с lang="uk", viewport без запрета масштабирования`

#### 2.5. Playwright: скриншоты и проверка горизонтального скролла — 60 мин
- **Что:** `@playwright/test`, `playwright.config.ts` с проектами `mobile-375` (375 × 812) и `desktop-1280` (1280 × 800), `webServer` = `npm run preview`. Скрипт `scripts/screens.mjs`: `npm run screens -- --path=/styleguide --name=2-16-styleguide [--widths=320,375,768,1280]`, по умолчанию 375 и 1280, full-page, в `docs/screens/<name>-<ширина>.png`. `tests/e2e/layout.spec.ts`: для списка страниц `scrollWidth ≤ clientWidth` на 320, 375, 768, 1280. Скрипты `test:e2e`, `screens`.
- **Файлы:** `playwright.config.ts`, `scripts/screens.mjs`, `tests/e2e/layout.spec.ts`, `package.json`.
- **Готово, когда:** `npm run screens -- --path=/ --name=2-5-init` создаёт `2-5-init-375.png` и `2-5-init-1280.png`; `npm run test:e2e` зелёный; намеренно широкий блок роняет `layout.spec` (после проверки убран).
- **Коммит:** `Фаза 2: Playwright, скрипт скриншотов 375/1280 и проверка горизонтального скролла`

#### 2.6. facts.ts, хелперы и компонент Fact — 75 мин
- **Что:** `src/content/facts.ts` с типами `Placeholder` и `Fact<T>`, все заглушки из ARCHITECTURE.md 5.2 (цены, параметры квиза, обещания, сроки, цифры доверия, гарантия и оплата, контакты, юридическое, бригада 3 карточки-заглушки, отзывы 3 заглушки, материалы, медиа), `brand` из CLAUDE.md, `flags: { quizResultVariant: 'B', seasonalBadge: false }`, `satisfies FactsSchema`. `src/lib/facts.ts`: `isPlaceholder()`, `num()`, `formatUAH()` (узкий неразрывный пробел, «грн», без ₴), `formatPhone()`. `Fact.astro`: значение или `<span class="fact-ph" data-placeholder="NAME">{{NAME}}</span>` (моно, фон `--color-placeholder`, пунктир графит, радиус 4 px, **не жёлтый**).
- **Файлы:** `src/content/facts.ts`, `src/lib/facts.ts`, `src/components/ui/Fact.astro`.
- **Готово, когда:** сборка чистая (строгие типы проходят); в `facts.ts` нет ни одного реального числа, имени или контакта, кроме бренда и дескриптора; на временной `/` три `Fact` (заглушка, число, строка) видны правильно; скриншоты `2-6-fact-375.png`, `2-6-fact-1280.png`.
- **Коммит:** `Фаза 2: facts.ts со всеми заглушками, хелперы и компонент Fact`

#### 2.7. Проверки заглушек и запрещённого слова — 60 мин
- **Что:** `scripts/check-words.mjs`: ищет запрещённое слово из CLAUDE.md, п.3, во всех падежах по-русски и по-украински в `src/` и `dist/`; слово хранится в закодированном виде, сам скрипт исключён из проверки; находка → код выхода 1. `scripts/check-placeholders.mjs`: сканирует `dist/**/*.{html,js,json,xml,txt}` на `{{` и `data-placeholder`, выводит отчёт, с `--strict` код выхода 1. `check:facts`: при `SITE_ENV=production` обходит `facts` и падает со списком имён заглушек. `build` = `astro check && astro build && node scripts/check-words.mjs`; `check:placeholders` в `build` не входит (ARCHITECTURE.md 5.4).
- **Файлы:** `scripts/check-words.mjs`, `scripts/check-placeholders.mjs`, `scripts/check-facts.mjs` (или проверка в `astro.config.mjs` через хук), `package.json`.
- **Готово, когда:** обычный `npm run build` зелёный; временная вставка запрещённого слова в `src/` роняет сборку (после проверки убрана, в коммит не попадает); `npm run check:placeholders` печатает отчёт; `SITE_ENV=production npm run build` падает со списком заглушек — это ожидаемое поведение.
- **Коммит:** `Фаза 2: проверки заглушек и запрещённого слова в сборке`

#### 2.8. Временный логотип, знак, favicon — 45 мин
- **Что:** временные SVG варианта «Кутник»: жёлтый столярный угольник + буква В + слово ВИМІР. **Буквы нарисованы контурами (`<path>`), без `<text>` и без ссылок на шрифты.** В каждом файле комментарий `<!-- TODO: временный логотип, заменить финальным от владельца -->`. `logo.svg` (на светлом), `logo-dark.svg` (на графите), `mark.svg` (угольник + В), `favicon.svg` (= mark). `apple-touch-icon.png` 180 × 180 из mark.
- **Файлы:** `public/brand/logo.svg`, `public/brand/logo-dark.svg`, `public/brand/mark.svg`, `public/favicon.svg`, `public/apple-touch-icon.png`.
- **Готово, когда:** поиск по `public/` не находит `<text` и `font-family`; во всех SVG есть TODO; favicon виден во вкладке; жёлтый в логотипе — только угольник; скриншоты `2-8-brand-375.png`, `2-8-brand-1280.png` (временная страница или `/` с тремя файлами на светлом и тёмном фоне).
- **Коммит:** `Фаза 2: временный логотип «Кутник», знак и favicon (TODO: финальные файлы)`

#### 2.9. Icon, Dimension, PlaceholderImage — 60 мин
- **Что:** `Icon.astro` — inline SVG по имени (телефон, Viber, Telegram, Instagram, бургер, закрыть, стрелка, галочка), `aria-hidden` по умолчанию. `Dimension.astro` — размерная линия с подписью в мм (`text-dim`, `aria-hidden="true"`), графит или дуб. `PlaceholderImage.astro`: пропсы `width`, `height`, `label`; серый `#D6D6D1` с `aspect-ratio`, по центру моно-подпись «1600 × 1067 · кейс, фото 1» и тонкая размерная линия; `role="img"` с `aria-label`; не даёт CLS.
- **Файлы:** `src/components/ui/Icon.astro`, `src/components/ui/Dimension.astro`, `src/components/ui/PlaceholderImage.astro`.
- **Готово, когда:** плейсхолдеры 3:2, 4:5, 16:9 на 375 px не шире экрана, подпись читается (контраст 11 : 1); скриншоты `2-9-placeholder-375.png`, `2-9-placeholder-1280.png`.
- **Коммит:** `Фаза 2: компоненты Icon, Dimension и PlaceholderImage`

#### 2.10. Button — 60 мин
- **Что:** `Button.astro` как `<a>` или `<button>`; варианты `primary` (фон рулетка, текст графит, hover `--color-tape-hover`), `secondary` (графит / штукатурка), `outline` (рамка line-strong), `link`; размеры `md` (48 px) и `lg` (56 px); иконка слева; `fullWidth`. У `primary` атрибуты `data-cta="primary"` и `data-cta-priority` (ARCHITECTURE.md 6.9) и проп `fallback="secondary"` для кнопок шапки и панели (без JS они графитовые).
- **Файлы:** `src/components/ui/Button.astro`.
- **Готово, когда:** высота всех вариантов ≥ 48 px (проверка в DevTools или Playwright); белого текста на жёлтом нет; фокус-кольцо видно на светлом и тёмном фоне; скриншоты `2-10-button-375.png`, `2-10-button-1280.png`.
- **Коммит:** `Фаза 2: компонент Button (primary, secondary, outline, link)`

#### 2.11. SectionTitle — 30 мин
- **Что:** `SectionTitle.astro`: надзаголовок (опционально, дуб), заголовок `h2` (уровень настраивается), подзаголовок ≤ 65ch, выравнивание, вариант на тёмном фоне, опционально `Dimension` как деталь.
- **Файлы:** `src/components/ui/SectionTitle.astro`.
- **Готово, когда:** длинный украинский заголовок не вылезает за край на 320 и 375 px (переносы работают); скриншоты `2-11-section-title-375.png`, `2-11-section-title-1280.png`.
- **Коммит:** `Фаза 2: компонент SectionTitle`

#### 2.12. Header с бургером — 90 мин
- **Что:** `Header.astro`: логотип, меню «Кухні, Меблі, Ремонт, Роботи, Контакти», телефон (`Fact` PHONE_DISPLAY, ссылка `tel:` на PHONE_E164), кнопка «Безкоштовний замір» (`primary`, приоритет 1, без JS `secondary`), пока ведёт на `/#zamir`. Закреплена (`sticky`, z 40), тень `--shadow-raised` после прокрутки. < 1024 px: логотип, иконка звонка, бургер (все зоны 48 × 48). `MobileMenu.astro` + островок `menu` (`aria-expanded`, `aria-controls`, Esc закрывает, фокус возвращается на бургер, скролл страницы заблокирован).
- **Файлы:** `src/components/layout/Header.astro`, `src/components/layout/MobileMenu.astro`, `src/scripts/menu.ts` (или `<script>` в компоненте), `src/layouts/BaseLayout.astro`.
- **Готово, когда:** на 375 px бургер открывает и закрывает меню мышью и клавиатурой, горизонтального скролла нет; на 1280 px полное меню в одну строку; шапка остаётся вверху при прокрутке; скриншоты `2-12-header-375.png`, `2-12-header-menu-open-375.png`, `2-12-header-1280.png`.
- **Коммит:** `Фаза 2: шапка с бургером и мобильным меню`

#### 2.13. MobileBottomBar — 75 мин
- **Что:** панель < 1024 px, 3 равные ячейки: «Подзвонити» (`tel:`), «Viber» (ссылка из `facts.contacts`), «Розрахувати» (`/#kvyz`, `primary` приоритет 2, без JS `secondary`); иконка + подпись 16 px, каждая ≥ 48 px. Высота 64 px + `env(safe-area-inset-bottom)`, z 50, тень вверх. `body { padding-bottom }` и `html { scroll-padding-bottom }` на ту же величину. Островок `bottom-bar`: прячет панель при фокусе в `input`/`textarea`/`select` и при открытом `<dialog>`, возвращает через 150 мс после `focusout`.
- **Файлы:** `src/components/layout/MobileBottomBar.astro`, `src/scripts/bottom-bar.ts`, `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `tests/e2e/bottom-bar.spec.ts`.
- **Готово, когда:** на 375 px панель видна внизу, последний элемент страницы не перекрыт; при фокусе в тестовом поле на `/styleguide` панель скрывается (e2e `bottom-bar.spec.ts` зелёный); на 1280 px панели нет; скриншоты `2-13-bottom-bar-375.png`, `2-13-bottom-bar-1280.png`.
- **Коммит:** `Фаза 2: нижняя мобильная панель Подзвонити / Viber / Розрахувати`

#### 2.14. Коллекция кейсов и демо-кейсы — 60 мин
- **Что:** `src/content.config.ts` по схеме ARCHITECTURE.md 3.2 (Zod, `superRefine`, `placeholder`, `draft`; при `SITE_ENV=production` демо и черновики исключаются). 8 демо-кейсов `placeholder: true` по образцу 3.3: по 2 на каждую форму кухни (`pryama`, `kutova`, `p-podibna`, `ostriv`), все тексты — заглушки `{{CASE_...}}`, `featured: true` и `featuredOrder` 1–8. `src/lib/cases.ts`: `buildAlt()`, получение featured-кейсов.
- **Файлы:** `src/content.config.ts`, `src/content/cases/*-demo-0N.md` (8 шт.), `src/lib/cases.ts`.
- **Готово, когда:** сборка чистая; кейс без `kitchenShape` при `category: kitchen` роняет сборку с понятной ошибкой (после проверки убран); в демо-кейсах нет выдуманных районов, материалов, сроков и цен.
- **Коммит:** `Фаза 2: коллекция кейсов со схемой и 8 демо-кейсов на заглушках`

#### 2.15. CaseCard — 60 мин
- **Что:** `CaseCard.astro`: обложка (`PlaceholderImage` 4:3 для демо), название, форма кухни или тип шкафа, район, срок и цена «від» через `Fact` (строка цены скрыта, если поля нет), ссылка на `/roboty/<slug>` на всю карточку, `data-shape` и `data-category` для фильтра. Белая карточка, радиус 8 px, тень только на hover на десктопе.
- **Файлы:** `src/components/cases/CaseCard.astro`.
- **Готово, когда:** на 375 px карточка во всю ширину контейнера, на 1280 px — в сетке 3 колонки; вся карточка кликабельна, фокус виден; длинное название переносится; скриншоты `2-15-case-card-375.png`, `2-15-case-card-1280.png`.
- **Коммит:** `Фаза 2: карточка кейса CaseCard`

#### 2.16. Страница /styleguide — 75 мин
- **Что:** `src/pages/styleguide.astro` (`noindex`, не в sitemap): палитра с HEX и подписью назначения, шкала шрифтов (кириллица с і, ї, є, ґ), кнопки всех вариантов и размеров, SectionTitle, Fact, PlaceholderImage, Dimension, иконки, логотипы на светлом и тёмном, CaseCard (3 демо), тестовое поле ввода для проверки панели. Header и MobileBottomBar — через BaseLayout.
- **Файлы:** `src/pages/styleguide.astro`, `tests/e2e/layout.spec.ts` (добавить `/styleguide`).
- **Готово, когда:** `/styleguide` открывается; `layout.spec` зелёный на 320/375/768/1280; скриншоты `2-16-styleguide-375.png`, `2-16-styleguide-1280.png` (full-page); `npm run check:placeholders` показывает только ожидаемые заглушки.
- **Коммит:** `Фаза 2: страница /styleguide со всеми компонентами`

#### 2.17. Ревью владельца и правки — 60 мин
- **Что:** показать владельцу `/styleguide` (скриншоты или preview), собрать замечания, внести правки в пределах фазы 2. Замечания и решения — короткий список в описании коммита.
- **Файлы:** по замечаниям.
- **Готово, когда:** владелец письменно одобрил; обновлены скриншоты `2-17-styleguide-final-375.png`, `2-17-styleguide-final-1280.png`; все проверки DoD зелёные.
- **Коммит:** `Фаза 2: правки по ревью владельца, дизайн-система принята`

### Контрольная точка владельца — фаза 2

**Показать:** `/styleguide` на телефоне и на компьютере (или скриншоты 375 и 1280 px), открытое и закрытое меню, нижнюю панель, временный логотип.
**Владелец подтверждает:**
- цвета, шрифты и характер кнопок («спокойно и дорого»);
- вид серых плейсхолдеров фото и заглушек фактов;
- состав шапки и нижней панели;
- что временный логотип допустим до финальных файлов;
- можно переходить к фазе 3.

---

## Фаза 3 — Главная страница на заглушках

Цель: главная выглядит готовой, кроме реальных фото и цифр. Порядок блоков строго по ТЗ. Каждый блок: сначала 375 px, затем 768 и 1280 px. Скриншоты — по блоку (элемент или прокрутка к якорю) и full-page в финальной задаче.

#### 3.1. Каркас главной — 45 мин
- **Что:** `src/pages/index.astro` на BaseLayout; компоненты-заготовки из `src/components/sections/` в порядке ТЗ: Hero (1), TrustNumbers (2), Portfolio (3), BeforeAfterSection (4), QuizSection (5, якорь `id="kvyz"`), Team (6), Process (7), Prices (8), Materials (9), Reviews (10), WarrantyPayment (11), Faq (12), FinalCta (13, якорь `id="zamir"`), Footer (14) в `layout/`. В каждой заготовке — заголовок блока и отступ `--space-section`.
- **Файлы:** `src/pages/index.astro`, 13 файлов в `src/components/sections/`, `src/components/layout/Footer.astro`.
- **Готово, когда:** порядок блоков на странице совпадает с таблицей ТЗ; `/#kvyz` и `/#zamir` прокручивают к нужным блокам, не прячась под шапкой (`scroll-margin-top`); скриншоты `3-1-skeleton-375.png`, `3-1-skeleton-1280.png`.
- **Коммит:** `Фаза 3: каркас главной из 14 блоков в порядке ТЗ`

#### 3.2. Блок 0 на главной и правило «один жёлтый» — 75 мин
- **Что:** шапка на главной (поведение при прокрутке поверх hero). Островок `cta-arbiter` (`src/lib/cta-arbiter.ts`): `IntersectionObserver` по `[data-cta="primary"]` (видимость ≥ 50 %), жёлтой остаётся видимая кнопка с наибольшим приоритетом, остальные получают вид `secondary`. Без JS шапка и панель графитовые. Тест `tests/e2e/cta.spec.ts`: в нескольких точках прокрутки на 375 и 1280 px видимых жёлтых элементов ≤ 1.
- **Файлы:** `src/lib/cta-arbiter.ts`, `src/layouts/BaseLayout.astro`, `src/components/layout/Header.astro`, `tests/e2e/cta.spec.ts`.
- **Готово, когда:** `cta.spec` зелёный; на 1280 px кнопка шапки желтеет только после ухода hero с экрана; скриншоты `3-2-header-375.png`, `3-2-header-1280.png`.
- **Коммит:** `Фаза 3: шапка на главной и правило одного жёлтого элемента на экран`

#### 3.3. Блок 1 Hero — 375 px — 75 мин
- **Что:** H1 по ТЗ: «Кухні на замовлення в Черкасах — від заміру до монтажу однією бригадою», вторая часть зависит от `{{PROMISE_ONE_TEAM}}` (ARCHITECTURE.md 5.2). Три выгоды: замір і 3D за `{{PROMISE_MEASURE_3D_HOURS}}` год, `{{PROMISE_PRICE_FIXED_TEXT}}`, гарантія `{{WARRANTY_YEARS}}`. Кнопки: «Розрахувати вартість» (`primary` lg, приоритет 3, → `#kvyz`), «Написати у Viber» (`secondary`). Фон — `PlaceholderImage` full-bleed (`{{HERO_MEDIA}}`, размеры для LCP). `Badge.astro` сезонный: показывается только при `flags.seasonalBadge`, текст `{{SEASONAL_BADGE_TEXT}}`.
- **Файлы:** `src/components/sections/Hero.astro`, `src/components/ui/Badge.astro`.
- **Готово, когда:** на 375 px H1 (28 px) и обе кнопки видны на первом экране над нижней панелью; H1 на странице один; переключение `seasonalBadge` в `facts.ts` показывает и прячет бейдж; на 320 px нет горизонтального скролла; скриншоты `3-3-hero-375.png`, `3-3-hero-320.png`.
- **Коммит:** `Фаза 3: блок 1 — первый экран, телефон`

#### 3.4. Блок 1 Hero — 1280 px и блок 2 «Цифри довіри» — 75 мин
- **Что:** раскладка hero на 768 и 1280 px (текст слева, фото справа или фото фоном с затемнением — по токенам, без жёлтого на светлом). `TrustNumbers.astro`: 4 числа `{{TRUST_KITCHENS_DONE}}`, `{{TRUST_YEARS}}`, `{{WARRANTY_YEARS}}`, `{{PRODUCTION_DAYS_TOTAL}}` через `Fact`, шрифт `text-number`, подписи под числами; 2 × 2 на телефоне, 4 в ряд на десктопе.
- **Файлы:** `src/components/sections/Hero.astro`, `src/components/sections/TrustNumbers.astro`.
- **Готово, когда:** нет ни одного реального числа; сетка не ломается при длинной заглушке; скриншоты `3-4-hero-1280.png`, `3-4-trust-375.png`, `3-4-trust-1280.png`.
- **Коммит:** `Фаза 3: первый экран на десктопе и блок цифр доверия`

#### 3.5. Блок 3 «Портфоліо» с фильтром — 90 мин
- **Что:** `Portfolio.astro`: 6–8 featured демо-кейсов через `CaseGrid.astro` и `CaseCard`. `Chip.astro` и `CaseFilter.astro`: «Усі / Пряма / Кутова / П-подібна / З островом» (горизонтальная лента со своим `overflow-x: auto` на телефоне). Островок `portfolio-filter`: скрывает карточки по `data-shape`, `aria-pressed` на чипах, без JS видны все. Кнопка «Всі роботи» (`secondary`) на `/roboty` (страница появится в фазе 5).
- **Файлы:** `src/components/sections/Portfolio.astro`, `src/components/cases/CaseGrid.astro`, `src/components/cases/CaseFilter.astro`, `src/components/ui/Chip.astro`, `src/scripts/portfolio-filter.ts`.
- **Готово, когда:** клик по «Кутова» оставляет 2 кутовые карточки, «Усі» возвращает все; лента чипов не даёт горизонтального скролла страницы; сетка 1 / 2 / 3 колонки на 375 / 768 / 1280; скриншоты `3-5-portfolio-375.png`, `3-5-portfolio-filtered-375.png`, `3-5-portfolio-1280.png`.
- **Коммит:** `Фаза 3: блок 3 — портфолио с фильтром по форме кухни`

#### 3.6. Блок 4 «Було / стало» — 75 мин
- **Что:** `BeforeAfter.astro` на `<input type="range">` + `clip-path` (островок `before-after`), ручка ≥ 48 px, `aria-label` «Порівняти було і стало», управление стрелками. `BeforeAfterSection.astro`: 2–3 пары `PlaceholderImage` (`{{BEFORE_AFTER_PAIRS}}`) с подписями «Було» / «Стало», на телефоне лента со scroll-snap.
- **Файлы:** `src/components/ui/BeforeAfter.astro`, `src/components/sections/BeforeAfterSection.astro`, `src/scripts/before-after.ts`.
- **Готово, когда:** ползунок двигается пальцем в эмуляции касаний на 375 px, при этом страница не прокручивается вбок; работает с клавиатуры; скриншоты `3-6-before-after-375.png`, `3-6-before-after-1280.png`.
- **Коммит:** `Фаза 3: блок 4 — слайдер «було / стало»`

#### 3.7. Блок 5 (место под квиз) и блок 6 «Своя бригада» — 90 мин
- **Что:** `QuizSection.astro`: заголовок «Дізнайтесь вартість вашої кухні за 1 хвилину», контейнер `id="kvyz"` с зарезервированной высотой и серой заглушкой «Квіз — фаза 4» (для `/styleguide`-логики, без жёлтых элементов). `Team.astro`: крупный блок, 3 карточки мастеров из `facts.team` (фото `PlaceholderImage` 4:5, `{{MASTER_n_NAME}}`, `{{MASTER_n_ROLE}}`, стаж `{{MASTER_n_YEARS}}`, фраза `{{MASTER_n_QUOTE}}`); на телефоне лента со scroll-snap, на десктопе сетка; место под видео.
- **Файлы:** `src/components/sections/QuizSection.astro`, `src/components/sections/Team.astro`.
- **Готово, когда:** ни одного реального имени; блок 6 визуально крупнее соседних (ТЗ: «главный козырь»); вёрстка выдерживает 2 и 6 карточек (проверено временным изменением числа); скриншоты `3-7-quiz-slot-375.png`, `3-7-team-375.png`, `3-7-team-1280.png`.
- **Коммит:** `Фаза 3: место под квиз и блок бригады`

#### 3.8. VideoFacade для видео бригады — 45 мин
- **Что:** `VideoFacade.astro`: постер (`PlaceholderImage` 16:9), кнопка «Дивитися відео» 48 px, по клику подставляется `<video preload="none">` с `src` из `{{TEAM_VIDEO}}`; до клика видео не грузится. Встроить в Team.
- **Файлы:** `src/components/ui/VideoFacade.astro`, `src/scripts/video-facade.ts`, `src/components/sections/Team.astro`.
- **Готово, когда:** в Network до клика нет запросов к видео; кнопка доступна с клавиатуры; скриншоты `3-8-team-video-375.png`, `3-8-team-video-1280.png`.
- **Коммит:** `Фаза 3: фасад видео бригады с загрузкой по клику`

#### 3.9. Блок 7 «Як працюємо» и блок 8 «Ціни від» — 90 мин
- **Что:** `Process.astro`: 5 шагов (заявка → замір → 3D і кошторис → договір і виробництво → монтаж), у каждого срок: шаг 1 — `{{PROMISE_CALLBACK_MINUTES}}` хв, шаги 2–5 — `{{TERM_STEP_*_DAYS}}`, итог `{{TERM_MEASURE_TO_INSTALL_DAYS}}`; мотив размерной линии между шагами. `Prices.astro`: 4 карточки (пряма, кутова, з островом, шафа-купе) с `{{PRICE_FROM_*}}` шрифтом `text-price`, подпись «точна ціна після заміру», одна кнопка в квиз на блок (`primary`, приоритет 3).
- **Файлы:** `src/components/sections/Process.astro`, `src/components/sections/Prices.astro`.
- **Готово, когда:** сроки и цены — только заглушки; в блоке 8 одна жёлтая кнопка, у карточек вторичные ссылки; шаги вертикально на 375, горизонтально на 1280; скриншоты `3-9-process-375.png`, `3-9-process-1280.png`, `3-9-prices-375.png`, `3-9-prices-1280.png`.
- **Коммит:** `Фаза 3: блоки «Як працюємо» и «Ціни від»`

#### 3.10. Блок 9 «Матеріали і фурнітура» и блок 10 «Відгуки» — 75 мин
- **Что:** `Materials.astro`: сетка логотипов-плейсхолдеров из `{{HARDWARE_BRANDS}}` и `{{MATERIAL_BRANDS}}` (без названий реальных брендов). `Reviews.astro`: 3 карточки из `facts.reviews` (`{{REVIEW_n_AUTHOR}}`, район, текст или место под скриншот, источник), рейтинг `{{GOOGLE_RATING}}` и число `{{GOOGLE_REVIEWS_COUNT}}`, ссылка «Всі відгуки в Google» на `{{GOOGLE_REVIEWS_URL}}`.
- **Файлы:** `src/components/sections/Materials.astro`, `src/components/sections/Reviews.astro`.
- **Готово, когда:** ни одного придуманного отзыва, бренда или рейтинга; карточки отзывов лентой на 375, сеткой на 1280; скриншоты `3-10-materials-375.png`, `3-10-materials-1280.png`, `3-10-reviews-375.png`, `3-10-reviews-1280.png`.
- **Коммит:** `Фаза 3: блоки материалов и отзывов на заглушках`

#### 3.11. Блок 11 «Гарантія і оплата» и блок 12 FAQ — 90 мин
- **Что:** `WarrantyPayment.astro`: `{{WARRANTY_YEARS}}`, `{{WARRANTY_TERMS}}`, `{{PAYMENT_PREPAY_PERCENT}}`, `{{PAYMENT_SCHEDULE}}`, `{{PAYMENT_METHODS}}`. `src/content/faq.ts`: 6–8 вопросов (терміни, ціна, матеріали, гарантія, техніка, виїзд в область), ответы собираются из `facts` (`{{FAQ_APPLIANCES}}`, `{{SERVICE_AREA_TERMS}}` и т. д.). `Accordion.astro` на `<details>`/`<summary>`, зона нажатия ≥ 48 px. `Faq.astro`.
- **Файлы:** `src/components/sections/WarrantyPayment.astro`, `src/components/sections/Faq.astro`, `src/components/ui/Accordion.astro`, `src/content/faq.ts`.
- **Готово, когда:** аккордеон работает без JS; в ответах нет фактов вне `facts.ts`; скриншоты `3-11-warranty-375.png`, `3-11-warranty-1280.png`, `3-11-faq-open-375.png`, `3-11-faq-1280.png`.
- **Коммит:** `Фаза 3: блоки гарантии и оплаты, FAQ-аккордеон`

#### 3.12. Поля форм и маска телефона — 75 мин
- **Что:** `Input.astro`, `PhoneInput.astro` (маска `+380 XX XXX XX XX`, `inputmode="tel"`, `autocomplete="tel"`), `Select.astro`, `Textarea.astro`, `ConsentCheckbox.astro` (по умолчанию не отмечена, ссылка на `/polityka`), `Honeypot.astro` (поле `website`, скрыто от людей и скринридеров). `src/lib/phone.ts`: маска и нормализация к `+380XXXXXXXXX`. Ошибки — текст + иконка + `aria-describedby`, цвет `--color-error`. Поля 48 px, шрифт 16 px. Добавить поля на `/styleguide`.
- **Файлы:** `src/components/ui/form/*.astro`, `src/lib/phone.ts`, `src/pages/styleguide.astro`.
- **Готово, когда:** на iOS-эмуляции нет зума при фокусе (16 px); ввод «0671234567» и «380671234567» приводится к одному виду; ошибка видна не только цветом; скриншоты `3-12-form-fields-375.png`, `3-12-form-fields-1280.png`.
- **Коммит:** `Фаза 3: поля форм, маска +380 и согласие`

#### 3.13. Блок 13 «Фінальний заклик» — только интерфейс — 75 мин
- **Что:** `ZamirForm.astro`: «Ім'я», «Телефон», «Зручний час» (Select), согласие, honeypot, кнопка «Надіслати заявку» (`primary` lg, приоритет 3); `action="/api/lead" method="post"` по ARCHITECTURE.md, но островок `lead-form` перехватывает отправку: клиентская валидация (имя 2–50, телефон +380 и 9 цифр, согласие), при валидных данных сетевой запрос **не выполняется** — подключение заглушки отправки и переход на `/dyakuyemo` в задаче 4.8, бэкенд в фазе 6. `FinalCta.astro`: форма + карта зоны работы (`PlaceholderImage`, `{{SERVICE_AREA_MAP}}`, `{{SERVICE_AREA_TEXT}}`).
- **Файлы:** `src/components/forms/ZamirForm.astro`, `src/components/sections/FinalCta.astro`, `src/scripts/lead-form.ts`.
- **Готово, когда:** пустая отправка показывает ошибки у полей и ставит фокус на первое ошибочное; на 375 px при фокусе в поле нижняя панель скрыта, кнопка отправки над панелью видна полностью; запросов в Network нет; скриншоты `3-13-final-cta-375.png`, `3-13-final-cta-errors-375.png`, `3-13-final-cta-1280.png`.
- **Коммит:** `Фаза 3: блок 13 — форма замера (интерфейс без отправки) и карта зоны`

#### 3.14. Попап замера из шапки — 60 мин
- **Что:** `ZamirModal.astro` на `<dialog>` с той же `ZamirForm`; кнопка «Безкоштовний замір» в шапке открывает попап (без JS — ссылка на `/#zamir`). Закрытие крестиком, Esc и кликом по фону; фокус внутри; при открытии нижняя панель скрыта; `::backdrop` графит 60 %.
- **Файлы:** `src/components/forms/ZamirModal.astro`, `src/components/layout/Header.astro`.
- **Готово, когда:** попап открывается и закрывается мышью и клавиатурой на 375 и 1280 px; на телефоне форма помещается и прокручивается внутри окна; скриншоты `3-14-zamir-modal-375.png`, `3-14-zamir-modal-1280.png`.
- **Коммит:** `Фаза 3: всплывающая форма замера из шапки`

#### 3.15. Блок 14 Футер — 60 мин
- **Что:** `Footer.astro`: `logo-dark`, дескриптор, телефон (`tel:`), Viber, Telegram, Instagram (кнопки `outline`, кликабельны), `{{EMAIL_PUBLIC}}`, `{{SCHEDULE_TEXT}}`, `{{ADDRESS}}`, `{{FOP_NAME}}`, `{{FOP_TAX_ID}}`, ссылка «Політика конфіденційності». Тёмный фон, текст штукатурка.
- **Файлы:** `src/components/layout/Footer.astro`.
- **Готово, когда:** все ссылки — `<a>` с корректной схемой (`tel:`, `mailto:` и т. д.), зоны нажатия ≥ 48 px; футер не перекрыт нижней панелью на 375 px; скриншоты `3-15-footer-375.png`, `3-15-footer-1280.png`.
- **Коммит:** `Фаза 3: футер с контактами, ФОП и политикой`

#### 3.16. Финальный проход по главной — 90 мин
- **Что:** full-page скриншоты 320, 375, 768, 1280. Проверки: (1) `cta.spec` — на каждом экране не больше одного жёлтого элемента; (2) `layout.spec` — нет горизонтального скролла на 320 и 375 (и 768, 1280); (3) `check-words` — нет запрещённого слова из CLAUDE.md, п.3, в `src/` и `dist/`; (4) `check:placeholders` — отчёт, все заглушки из `facts.ts` или демо-кейсов; (5) H1 один, порядок блоков = ТЗ; (6) кнопка заявки видна на каждом экране (hero, панель, шапка); (7) Lighthouse mobile для ориентира (не критерий фазы): Performance, Accessibility, Best Practices, SEO — цифры в описании коммита. Мелкие правки — здесь же, крупные — отдельной задачей.
- **Файлы:** правки по результатам, `docs/screens/3-16-home-{320,375,768,1280}.png`, `docs/screens/3-16-lighthouse-mobile.png`.
- **Готово, когда:** все e2e зелёные, сборка чистая, скриншоты лежат в `docs/screens/`, цифры Lighthouse записаны.
- **Коммит:** `Фаза 3: финальная проверка главной — один жёлтый на экран, без горизонтального скролла, Lighthouse`

### Контрольная точка владельца — фаза 3

**Показать:** главную целиком на телефоне и компьютере (preview или скриншоты 375 и 1280 px), фильтр портфолио, слайдер «було / стало», аккордеон, форму с ошибками, попап замера, цифры Lighthouse.
**Владелец подтверждает:**
- порядок и содержание 14 блоков;
- тексты-шаблоны на украинском (заголовки, подписи, кнопки);
- что видны все места, куда нужны его факты (заглушки);
- главная «выглядит готовой, кроме реальных фото и цифр»;
- можно переходить к фазе 4.

---

## Фаза 4 — Квиз (только интерфейс)

Цель: квиз из 7 шагов с ветками проходится с телефона за 60 секунд и ведёт на `/dyakuyemo`. Модель данных — ARCHITECTURE.md, раздел 4. Отправки в сеть нет (бэкенд — фаза 6).

#### 4.1. Типы и конфигурация шагов — 60 мин
- **Что:** `src/lib/quiz/types.ts` по ARCHITECTURE.md 4.3. `src/lib/quiz/config.ts`: шаги и варианты из 4.1 с номером по ТЗ, граф `next()` из 4.2 (кухня 7 шагов, шафа 5, коротка форма 2). Фасады фильтруются по `{{FACADE_TYPES_CONFIRMED}}`: пока заглушка — показываются все 5 вариантов из ТЗ. Ширина шкафа из `{{QUIZ_WARDROBE_WIDTH_BANDS}}`: пока заглушка — 3 варианта с видимой заглушкой вместо подписи + «Не знаю — приїдемо заміряти». Подпись сезонного варианта шага 6 — `{{QUIZ_TIMING_SEASONAL_LABEL}}`.
- **Файлы:** `src/lib/quiz/types.ts`, `src/lib/quiz/config.ts`, `src/content/facts.ts` (если не хватает полей).
- **Готово, когда:** сборка чистая; пути веток совпадают с таблицей 4.2; в конфиге нет цифр ширины, цен и сроков.
- **Коммит:** `Фаза 4: типы и конфигурация шагов квиза с ветками`

#### 4.2. Vitest и автомат квиза — 90 мин
- **Что:** Vitest (`vitest.config.ts`, скрипт `test:unit`). `src/lib/quiz/machine.ts`: `start`, `answer`, `back`, `progress` («Крок N з M», до выбора ветки M = 7), смена ветки на шаге 1 удаляет ответы чужой ветки, история для «Назад», ответ остаётся выбранным после «Назад». Тесты на все три ветки.
- **Файлы:** `vitest.config.ts`, `package.json`, `src/lib/quiz/machine.ts`, `tests/unit/machine.test.ts`.
- **Готово, когда:** `npm run test:unit` зелёный; покрыты: 3 ветки до конца, «Назад» с каждого шага, смена ветки, прогресс 1/7 → 2/5 для шафы.
- **Коммит:** `Фаза 4: Vitest и конечный автомат квиза с тестами`

#### 4.3. Хранение ответов — 60 мин
- **Что:** `src/lib/quiz/storage.ts`: `localStorage` ключ `vymir.quiz.v1`, TTL 7 дней от `updatedAt`, сброс при несовпадении `version`, «Почати заново», работа без хранилища (приватный режим, in-app браузер). Имя и телефон в `localStorage` не пишутся никогда.
- **Файлы:** `src/lib/quiz/storage.ts`, `tests/unit/storage.test.ts`.
- **Готово, когда:** тесты зелёные: сохранение и восстановление, истёкший TTL, чужая версия, недоступный `localStorage` (бросает исключение) — квиз не падает; в сохранённом объекте нет полей контакта.
- **Коммит:** `Фаза 4: сохранение ответов квиза в localStorage с TTL`

#### 4.4. Разметка квиза — 90 мин
- **Что:** `Quiz.astro` рендерит все шаги на сервере (виден один). `QuizProgress.astro` (полоса + «Крок N з M», `role="progressbar"`), `QuizStep.astro` (заголовок-вопрос, фокус на нём при смене шага), `QuizOption.astro` (карточка ≥ 64 px, 2 в ряд на 375 px, `role="radio"` в группе), схематичные SVG форм кухни (пряма, кутова, П-подібна, з островом) графитом. Кнопка «Назад» (`outline`, скрыта на шаге 1). Заменить заглушку в `QuizSection.astro`.
- **Файлы:** `src/components/quiz/Quiz.astro`, `QuizProgress.astro`, `QuizStep.astro`, `QuizOption.astro`, `public/quiz/*.svg` (или inline), `src/components/sections/QuizSection.astro`.
- **Готово, когда:** на 375 px шаг 1 и 2 помещаются на экран без прокрутки над нижней панелью; без JS виден шаг 1 и ссылка на форму замера; скриншоты `4-4-quiz-step1-375.png`, `4-4-quiz-step2-375.png`, `4-4-quiz-step1-1280.png`.
- **Коммит:** `Фаза 4: разметка квиза — шаги, варианты, прогресс, схемы кухонь`

#### 4.5. Островок quiz: переходы, «Назад», восстановление — 90 мин
- **Что:** островок `quiz` (загрузка при появлении): связывает разметку с `machine.ts` и `storage.ts`; переход по нажатию варианта без кнопки «Далі»; анимация прогресса 250 мс (без неё при `prefers-reduced-motion`); `history.pushState({ quizStep })` и `popstate` — системная «назад» Android возвращает на шаг; восстановление сохранённого шага при возврате; `/?kvyz=shafa#kvyz` выбирает ветку шафы заранее; ссылка «Почати заново».
- **Файлы:** `src/scripts/quiz.ts` (или `<script>` в `Quiz.astro`), `src/components/quiz/Quiz.astro`.
- **Готово, когда:** вручную на 375 px: ветка кухни до шага 7, «Назад» дважды, перезагрузка страницы — квиз на том же шаге с тем же прогрессом; кнопка браузера «назад» листает шаги; JS квиза ≤ 10 КБ gzip (цифра в описании коммита); скриншоты `4-5-quiz-step4-375.png`, `4-5-quiz-restored-375.png`.
- **Коммит:** `Фаза 4: логика квиза — переходы, Назад, восстановление после перезагрузки`

#### 4.6. Шаг 7 «Контакт» и коротка форма — 75 мин
- **Что:** `QuizContact.astro`: ім'я, телефон (`PhoneInput`, +380), «Як зв'язатися» Дзвінок / Viber / Telegram (по умолчанию «Дзвінок»), согласие (не отмечено), кнопка «Отримати розрахунок» (`primary` lg, приоритет 3). `QuizShortForm.astro` для «Ремонт» и «Інші меблі»: «Що потрібно зробити» + те же поля. Валидация: имя 2–50, телефон +380 и 9 цифр, согласие обязательно; ошибки текстом у поля. Тесты `tests/unit/phone.test.ts` для `src/lib/phone.ts`.
- **Файлы:** `src/components/quiz/QuizContact.astro`, `src/components/quiz/QuizShortForm.astro`, `src/scripts/quiz.ts`, `tests/unit/phone.test.ts`.
- **Готово, когда:** без согласия и с неполным номером отправка блокируется с понятными ошибками; при фокусе в поле нижняя панель скрыта, кнопка видна; `test:unit` зелёный; скриншоты `4-6-quiz-contact-375.png`, `4-6-quiz-contact-errors-375.png`, `4-6-quiz-short-form-375.png`.
- **Коммит:** `Фаза 4: шаг контакта и короткая форма квиза с валидацией +380`

#### 4.7. Расчёт цены для варианта А — 75 мин
- **Что:** `src/lib/quiz/price.ts` по ARCHITECTURE.md 4.4: формула только из заглушек `facts` через `num()`; причины `ok`, `variant-b`, `no-length`, `no-prices`, `range-too-wide`, `short-branch`; любая незаменённая заглушка → `no-prices` → показывается Б. Тесты на подставных числах **внутри теста** (в `facts.ts` чисел нет).
- **Файлы:** `src/lib/quiz/price.ts`, `tests/unit/price.test.ts`.
- **Готово, когда:** тесты зелёные для всех причин, остров, `advise`, `undecided`, шафа; с текущим `facts.ts` любой расчёт даёт `no-prices`; «NaN», «0 грн» и `{{` в результате невозможны (отдельный тест).
- **Коммит:** `Фаза 4: расчёт ориентировочной цены для варианта А по заглушкам`

#### 4.8. Заглушка отправки, /dyakuyemo и экраны А / Б — 90 мин
- **Что:** `src/lib/lead/submit.ts` — заглушка из ARCHITECTURE.md 7: ждёт 600 мс, отвечает `ok`, сеть не трогает. После `ok`: результат в `sessionStorage` `vymir.quiz.result`, очистка квиза, переход на `/dyakuyemo`. `src/pages/dyakuyemo.astro` (минимальная, `noindex`): заголовок «Дякуємо», `QuizResult.astro` — вариант по `facts.flags.quizResultVariant` с откатом А → Б по причине; А: «Орієнтовна вартість: від X до Y грн» (моно) + «Точна ціна — після безкоштовного заміру»; Б: «Дякуємо! Подзвонимо протягом `{{PROMISE_CALLBACK_MINUTES}}` хвилин з розрахунком» + `{{PROMISE_3D_GIFT_TEXT}}`; без данных квиза (переход из формы замера) — общий текст. Подключить `ZamirForm` к той же заглушке. Для демонстрации А — параметр только в dev (`?demoPrice=1` подставляет тестовые числа, в продакшен-сборку не попадает).
- **Файлы:** `src/lib/lead/submit.ts`, `src/pages/dyakuyemo.astro`, `src/components/quiz/QuizResult.astro`, `src/scripts/quiz.ts`, `src/scripts/lead-form.ts`.
- **Готово, когда:** флаг `'B'` → экран Б; флаг `'A'` при заглушках → тоже Б (откат); dev-демо показывает экран А; форма замера после валидной отправки ведёт на `/dyakuyemo`; скриншоты `4-8-dyakuyemo-b-375.png`, `4-8-dyakuyemo-a-demo-375.png`, `4-8-dyakuyemo-b-1280.png`.
- **Коммит:** `Фаза 4: заглушка отправки, страница «Дякуємо» и экраны результата А/Б за флагом`

#### 4.9. Заготовка событий квиза — 45 мин
- **Что:** `src/lib/analytics.ts`: `track(name, params)` кладёт событие в `window.dataLayer` (создаёт пустой список, если его нет) и логирует в dev; GTM не подключается до фазы 7. `quiz_start` — при первом выборе на шаге 1, один раз на жизнь `QuizState`; `quiz_step_N` — по номеру шага по ТЗ, без повторов (`firedSteps`); параметры `quiz_branch`, `step_id`. Имя и телефон в события не попадают.
- **Файлы:** `src/lib/analytics.ts`, `src/scripts/quiz.ts`, `tests/unit/analytics.test.ts` (или проверка в e2e).
- **Готово, когда:** при прохождении ветки шафы в `dataLayer` ровно `quiz_start`, `quiz_step_1`, `_2`, `_3`, `_6`, `_7`; «Назад» и повторный выбор не дублируют события; в событиях нет имени и телефона.
- **Коммит:** `Фаза 4: заготовка событий quiz_start и quiz_step_N в dataLayer`

#### 4.10. E2E квиза — 75 мин
- **Что:** `tests/e2e/quiz.spec.ts` на проекте `mobile-375`: (1) ветка кухни от первого нажатия до `/dyakuyemo` с замером времени — **≤ 60 с** с учётом реалистичных пауз между нажатиями (около 2–3 с на шаг, ввод имени и телефона посимвольно); (2) ветка шафы; (3) коротка форма; (4) «Назад» и прогресс; (5) восстановление после перезагрузки; (6) валидация контакта; (7) на каждом шаге не больше одного жёлтого элемента. Плюс прогон на `desktop-1280` для ветки кухни.
- **Файлы:** `tests/e2e/quiz.spec.ts`.
- **Готово, когда:** все сценарии зелёные; время ветки кухни выводится в отчёте и не превышает 60 с; `layout.spec` зелёный на всех шагах.
- **Коммит:** `Фаза 4: e2e квиза — три ветки, Назад, восстановление, прохождение за 60 секунд`

#### 4.11. Скриншоты всех шагов и подготовка к ревью — 60 мин
- **Что:** скриншоты всех шагов ветки кухни, шагов шафы, короткой формы и экранов А / Б на 375 px, ветки кухни на 1280 px; правки мелочей; ручная проверка на реальном телефоне (если есть) или в эмуляции WebKit.
- **Файлы:** `docs/screens/4-11-quiz-kitchen-step{1..7}-375.png`, `4-11-quiz-wardrobe-step{2,3}-375.png`, `4-11-quiz-short-375.png`, `4-11-quiz-kitchen-step1-1280.png`, `4-11-result-{a,b}-375.png`.
- **Готово, когда:** все DoD-проверки зелёные; скриншоты лежат в `docs/screens/`; владелец получил ссылку на preview или набор скриншотов.
- **Коммит:** `Фаза 4: скриншоты всех шагов квиза, подготовка к ревью`

### Контрольная точка владельца — фаза 4

**Показать:** владелец сам проходит квиз со своего телефона (preview) по веткам «Кухня», «Шафа», «Ремонт»; экраны А (демо на тестовых числах) и Б; время прохождения из e2e.
**Владелец подтверждает:**
- квиз проходится с телефона за 60 секунд (критерий фазы);
- формулировки вопросов и вариантов; список фасадов и столешниц сверен с тем, что реально делается;
- вариант результата А или Б (или оставить Б до получения цен);
- что `/dyakuyemo` — минимальная заглушка, полная страница в фазе 5.

---

## Что блокирует фазы 5+ (нужно от владельца)

Подробно — ARCHITECTURE.md, раздел 8.1 (вопросы 1–21) и 8.2 (риски Т1–Т17). Кратко:

- **Фаза 5 (контент):** фото кухонь и пары «було / стало», видео, мастера с письменным согласием, 4 цифры доверия, сроки по шагам, гарантия и оплата, бренды, 2–3 реальных отзыва, контакты и зона выезда, реквизиты ФОП, финальный логотип в кривых, решение по запрещённому слову из CLAUDE.md, п.3 (вопрос 5), место хранения фото (вопрос 20), кто добавляет кейсы (вопрос 16).
- **Квиз вариант А:** цены за метр по фасадам, правило надбавки за столешницу и остров, диапазоны ширины шкафа, границы длины (вопросы 1, 2, 17).
- **Фаза 6 (заявки):** Telegram-бот в рабочей группе, Google-таблица с доступом сервис-аккаунта, email для резерва, кто отвечает за перезвон (вопрос 18; риски Т3, Т4, Т10).
- **Фазы 7 и 9:** домен и доступ к DNS (вопрос 3, риск Т13), ник Instagram, карточка Google, тариф Vercel Pro (риск Т9).
- **Сезонность (риск Т15):** до запуска владелец называет даты включения и выключения бейджа «Встигніть до Нового року» и подпись шага 6 квиза после Нового года; флаги `flags.seasonalBadge` и `{{QUIZ_TIMING_SEASONAL_LABEL}}` в `src/content/facts.ts`.

