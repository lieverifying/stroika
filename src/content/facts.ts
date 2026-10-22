/**
 * Все факты о бизнесе — в одном месте (ARCHITECTURE.md, раздел 5).
 * Пока владелец не прислал данные, значение — заглушка вида missing('NAME'):
 * на сайте она видна как серая плашка, а боевая сборка с ней не пройдёт.
 * Ничего не выдумываем: цифры, имена, контакты и обещания — только от владельца.
 */

export type Placeholder = `{{${string}}}`;
/**
 * Факта нет — блок не выводим (режим запуска, решение владельца 2026-10-21: «нет факта — нет блока»).
 * В отличие от заглушки {{NAME}} не роняет боевую сборку: место на сайте скрыто. Имя — для FACTS-TODO.
 */
export interface Missing {
  readonly missing: string;
}
export const missing = (name: string): Missing => ({ missing: name });
export type Fact<T> = T | Placeholder | Missing;

export interface TeamMember {
  name: Fact<string>;
  role: Fact<string>;
  years: Fact<number>;
  quote: Fact<string>;
  photo: Fact<string>;
}

export interface Review {
  author: Fact<string>;
  district: Fact<string>;
  text: Fact<string>;
  source: Fact<'Google' | 'Instagram'>;
}

export interface WidthBand {
  id: string;
  label: string;
  /** Метры для экрана А с ценой; без них цену не считаем */
  min?: number;
  max?: number;
}

export type HeroOrientation = 'portrait' | 'landscape';

export interface Brand {
  name: string;
  logo: string;
}

export const facts = {
  // Не заглушки: заданы в CLAUDE.md
  brand: {
    name: 'Вимір',
    nameUpper: 'ВИМІР',
    descriptor: 'Кухні та меблі · Черкаси',
  },

  // Не заглушки: подтверждено владельцем (2026-10-20). Только корпусні меблі, без м'яких меблів.
  services: {
    furniture: ['кухні', 'шафи', 'гардеробні', 'передпокої', 'дитячі', 'тумби у ванну', 'ТВ-зони', 'меблі для бізнесу'],
    objects: ['квартири', 'будинки', 'офіси', 'магазини', 'салони'],
    // Что входит в монтаж
    install: ['врізка мийки та варильної поверхні', 'вбудована техніка', 'підключення води та розеток', 'прибирання після монтажу'],
  },

  // Владелец — подпись и фото в блоке «Нестандартне завдання»
  owner: {
    name: missing('OWNER_NAME'),
    photo: missing('OWNER_PHOTO'),
  },

  // Цен и сроков на сайте нет (решение владельца, 2026-10-21): считаем под задачу клиента.
  // Цены за метр ниже нужны только выключенному экрану квиза с ценой (вариант А), на сайте не показываются.
  prices: {
    perMeter: {
      mdfFilm: missing('PRICE_PER_M_MDF_FILM'),
      mdfPainted: missing('PRICE_PER_M_MDF_PAINTED'),
      dsp: missing('PRICE_PER_M_DSP'),
    },
    countertopPerMeter: {
      dsp: missing('COUNTERTOP_PER_M_DSP'),
      quartz: missing('COUNTERTOP_PER_M_QUARTZ'),
    },
    islandSurcharge: missing('ISLAND_SURCHARGE'),
    wardrobePerMeter: {
      kupe: missing('WARDROBE_PRICE_PER_M_KUPE'),
      rozpashna: missing('WARDROBE_PRICE_PER_M_ROZPASHNA'),
      harderobna: missing('WARDROBE_PRICE_PER_M_HARDEROBNA'),
    },
  },

  quiz: {
    kitchenLenMinM: missing('QUIZ_KITCHEN_LEN_MIN_M'),
    kitchenLenMaxM: missing('QUIZ_KITCHEN_LEN_MAX_M'),
    // Диапазоны ширины шафы — ТЗ v2 владельца (2026-10-21)
    wardrobeWidthBands: [
      { id: 'lt1.5', label: 'До 1,5 м' },
      { id: '1.5to2.5', label: '1,5–2,5 м' },
      { id: 'gt2.5', label: 'Більше 2,5 м' },
    ] as WidthBand[],
    priceRound: missing('QUIZ_PRICE_ROUND'),
    maxRangeRatio: missing('QUIZ_MAX_RANGE_RATIO'),
    facadeTypesConfirmed: missing('FACADE_TYPES_CONFIRMED'),
    countertopTypesConfirmed: missing('COUNTERTOP_TYPES_CONFIRMED'),
  },

  // Лид-магнит «Два варіанти планування» (/planuvannya, решение владельца 2026-10-22): срок подготовки в часах
  // в рабочие дни (PLAN_HOURS). Сколько планировок в неделю делаем — на сайт не выводим.
  leadMagnet: {
    planHours: 36,
  },

  // Обещания из ТЗ: на сайт попадут только после подтверждения владельцем
  promises: {
    callbackMinutes: missing('PROMISE_CALLBACK_MINUTES'),
    // ТЗ v2 (2026-10-21): вторая из трёх обіцянок — src/content/brand.ts
    priceFixedText: 'Ціну фіксуємо в договорі. Без доплат у процесі.',
    gift3dText: missing('PROMISE_3D_GIFT_TEXT'),
    oneTeam: missing('PROMISE_ONE_TEAM'),
  },


  trust: {
    kitchensDone: missing('TRUST_KITCHENS_DONE'),
    years: missing('TRUST_YEARS'),
  },

  warranty: {
    years: missing('WARRANTY_YEARS'),
    terms: missing('WARRANTY_TERMS'),
  },

  payment: {
    prepayPercent: missing('PAYMENT_PREPAY_PERCENT'),
    schedule: missing('PAYMENT_SCHEDULE'),
    methods: missing('PAYMENT_METHODS'),
  },

  contacts: {
    // Подтверждено владельцем 2026-10-21. Viber и Telegram — на тот же номер.
    phoneDisplay: '+380 75 991 48 43',
    phoneE164: '+380759914843',
    viberPhoneE164: '+380759914843',
    // Telegram по номеру телефона: https://t.me/+380759914843
    telegramUsername: '+380759914843',
    // Instagram и TikTok — подтверждено владельцем 2026-10-21, без @
    instagramHandle: 'vymir.che',
    tiktokHandle: 'vymir.che',
    emailPublic: missing('EMAIL_PUBLIC'),
    scheduleText: missing('SCHEDULE_TEXT'),
    scheduleSchema: missing('SCHEDULE_SCHEMA'),
    address: missing('ADDRESS'),
  },

  serviceArea: {
    text: 'Черкаси та область',
    terms: missing('SERVICE_AREA_TERMS'),
    cityDistricts: missing('SERVICE_AREA_CITY_DISTRICTS'),
    map: missing('SERVICE_AREA_MAP'),
  },

  google: {
    rating: missing('GOOGLE_RATING'),
    reviewsCount: missing('GOOGLE_REVIEWS_COUNT'),
    reviewsUrl: missing('GOOGLE_REVIEWS_URL'),
    reviewWriteUrl: missing('GOOGLE_REVIEW_WRITE_URL'),
    mapsUrl: missing('GOOGLE_MAPS_URL'),
  },

  // Политика: владелец данных — ФОП (только в политике, больше нигде), почта для вопросов о персональных данных.
  legal: {
    fopName: 'Мєшалкін Андрій Леонідович', // подтверждено владельцем 2026-10-21; «ФОП» дописывает страница
    privacyEmail: 'vymir.che@gmail.com', // подтверждено владельцем 2026-10-22
    // Дата этой редакции текста политики
    privacyUpdatedAt: '22.10.2026',
  },

  // Карточки мастеров — за флагом flags.teamCards (выключен): без имён и личных фото до согласия мастеров.
  // Вёрстка рассчитана на 2–6 карточек; сейчас 3 заглушки
  team: [1, 2, 3].map(
    (n): TeamMember => ({
      name: missing(`MASTER_${n}_NAME`),
      role: missing(`MASTER_${n}_ROLE`),
      years: missing(`MASTER_${n}_YEARS`),
      quote: missing(`MASTER_${n}_QUOTE`),
      photo: missing(`MASTER_${n}_PHOTO`),
    }),
  ),
  // Блок 6 (решение владельца, 2026-10-20): замір, дизайн-проєкт і монтаж — своя команда, детали делают фабрики-партнёры
  teamTitle: 'Своя команда',
  teamSubtitle: 'Замір, дизайн-проєкт і монтаж — наша команда.',
  // Одно фото команды или монтажа
  teamPhoto: missing('TEAM_PHOTO'),
  teamVideo: missing('TEAM_VIDEO'),

  // Реферальная программа — блок «Рекомендуйте нас» и вопрос в FAQ показываются при flags.referralEnabled
  referral: {
    reward: missing('REFERRAL_REWARD'),
    friendBonus: missing('REFERRAL_FRIEND_BONUS'),
  },

  materials: {
    hardwareBrands: missing('HARDWARE_BRANDS'),
    materialBrands: missing('MATERIAL_BRANDS'),
  },

  faq: {
    appliances: missing('FAQ_APPLIANCES'),
  },

  // Только реальные отзывы с согласия авторов
  reviews: [1, 2, 3].map(
    (n): Review => ({
      author: missing(`REVIEW_${n}_AUTHOR`),
      district: missing(`REVIEW_${n}_DISTRICT`),
      text: missing(`REVIEW_${n}_TEXT`),
      source: missing(`REVIEW_${n}_SOURCE`),
    }),
  ),

  media: {
    // Фото первого экрана — id работы из src/content/portfolio.json (вертикальная 4:5, получено 2026-10-21)
    hero: 'kukhnia-06',
    // Не заглушка, а настройка: рамка фото первого экрана на десктопе.
    // 'portrait' — 4:5 (реальные фото кухонь в основном вертикальные), 'landscape' — 4:3.
    heroOrientation: 'portrait' as HeroOrientation,
    // Не заглушка, а настройка: точка кадра, которая остаётся видна при обрезке фото (CSS object-position).
    // На телефоне фото обрезается до 16:10 — сюда ставим, где на фото главное, например '50% 60%'.
    heroFocus: '50% 50%',
    beforeAfterPairs: missing('BEFORE_AFTER_PAIRS'),
    ogImage: missing('OG_IMAGE'),
  },

  seasonalBadgeText: missing('SEASONAL_BADGE_TEXT'),

  // Не заглушки, а безопасные умолчания (решение владельца: экран Б по умолчанию)
  flags: {
    quizResultVariant: 'B' as 'A' | 'B',
    seasonalBadge: false as boolean,
    // Отправка заявок в api/lead.php (фаза 6, подключено 2026-10-21). false — формы только проверяют поля, сеть не трогают,
    // а боевая сборка (SITE_ENV=production) падает: scripts/check-release.mjs.
    leadSubmitEnabled: true as boolean,
    // Карточки мастеров в блоке 6 (имена, фото, стаж) — только после согласия мастеров на публикацию
    teamCards: false as boolean,
    // Блок «Рекомендуйте нас» и вопрос о рекомендациях в FAQ. Поле «Хто вас порекомендував?» в формах есть всегда.
    referralEnabled: false as boolean,
    // Сюжет «Шафа-купе» на странице «Як ми створюємо» (кадры получены 2026-10-21)
    storyWardrobe: true as boolean,
    // Режим запуска (2026-10-21): блоки без фактов скрыты. Включать вместе с фактами — иначе check-release не пропустит.
    trustNumbers: false as boolean, // «Цифри довіри» — trust.*, warranty.years
    reviews: false as boolean, // «Відгуки» — reviews, google.*
    warrantyPayment: false as boolean, // гарантия и порядок оплаты — warranty.*, payment.*
    instagram: true as boolean, // Instagram и TikTok — contacts.instagramHandle, contacts.tiktokHandle
    schedule: false as boolean, // график работы — contacts.scheduleText
    address: false as boolean, // адрес — contacts.address
    serviceAreaMap: false as boolean, // карта зоны выезда — serviceArea.map
  },
} satisfies FactsSchema;

/**
 * Значения по умолчанию для заглушек, которые нельзя показывать серой плашкой (например, заголовок блока).
 * Пока заглушка не заменена, на сайте — это значение; check-placeholders всё равно напоминает о нём.
 */
export const factDefaults: Record<string, string> = {};

interface FactsSchema {
  brand: { name: string; nameUpper: string; descriptor: string };
  services: { furniture: string[]; objects: string[]; install: string[] };
  owner: { name: Fact<string>; photo: Fact<string> };
  // Цен и сроков на сайте нет (решение владельца, 2026-10-21): считаем под задачу клиента.
  // Цены за метр ниже нужны только выключенному экрану квиза с ценой (вариант А), на сайте не показываются.
  prices: {
    perMeter: Record<'mdfFilm' | 'mdfPainted' | 'dsp', Fact<number>>;
    countertopPerMeter: Record<'dsp' | 'quartz', Fact<number>>;
    islandSurcharge: Fact<number>;
    wardrobePerMeter: Record<'kupe' | 'rozpashna' | 'harderobna', Fact<number>>;
  };
  quiz: {
    kitchenLenMinM: Fact<number>;
    kitchenLenMaxM: Fact<number>;
    wardrobeWidthBands: Fact<WidthBand[]>;
    priceRound: Fact<number>;
    maxRangeRatio: Fact<number>;
    facadeTypesConfirmed: Fact<string[]>;
    countertopTypesConfirmed: Fact<string[]>;
  };
  leadMagnet: { planHours: number };
  promises: {
    callbackMinutes: Fact<number>;
    priceFixedText: Fact<string>;
    gift3dText: Fact<string>;
    oneTeam: Fact<string>;
  };
  trust: { kitchensDone: Fact<number>; years: Fact<number> };
  warranty: { years: Fact<number>; terms: Fact<string> };
  payment: { prepayPercent: Fact<number>; schedule: Fact<string>; methods: Fact<string> };
  contacts: Record<string, Fact<string>>;
  serviceArea: { text: Fact<string>; terms: Fact<string>; cityDistricts: Fact<string[]>; map: Fact<string> };
  google: {
    rating: Fact<number>;
    reviewsCount: Fact<number>;
    reviewsUrl: Fact<string>;
    reviewWriteUrl: Fact<string>;
    mapsUrl: Fact<string>;
  };
  legal: Record<string, Fact<string>>;
  team: TeamMember[];
  teamPhoto: Fact<string>;
  teamVideo: Fact<string>;
  referral: { reward: Fact<string>; friendBonus: Fact<string> };
  materials: { hardwareBrands: Fact<Brand[]>; materialBrands: Fact<Brand[]> };
  faq: { appliances: Fact<string> };
  reviews: Review[];
  media: { hero: Fact<string>; heroOrientation: HeroOrientation; heroFocus: string; beforeAfterPairs: Fact<string[]>; ogImage: Fact<string> };
  seasonalBadgeText: Fact<string>;
  teamTitle: Fact<string>;
  teamSubtitle: Fact<string>;
  flags: {
    quizResultVariant: 'A' | 'B';
    seasonalBadge: boolean;
    leadSubmitEnabled: boolean;
    teamCards: boolean;
    referralEnabled: boolean;
    storyWardrobe: boolean;
    trustNumbers: boolean;
    reviews: boolean;
    warrantyPayment: boolean;
    instagram: boolean;
    schedule: boolean;
    address: boolean;
    serviceAreaMap: boolean;
  };
}
