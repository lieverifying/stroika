/**
 * Все факты о бизнесе — в одном месте (ARCHITECTURE.md, раздел 5).
 * Пока владелец не прислал данные, значение — заглушка вида '{{NAME}}':
 * на сайте она видна как серая плашка, а боевая сборка с ней не пройдёт.
 * Ничего не выдумываем: цифры, имена, контакты и обещания — только от владельца.
 */

export type Placeholder = `{{${string}}}`;
export type Fact<T> = T | Placeholder;

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
  min: number;
  max: number;
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

  prices: {
    perMeter: {
      mdfFilm: '{{PRICE_PER_M_MDF_FILM}}',
      mdfPainted: '{{PRICE_PER_M_MDF_PAINTED}}',
      dsp: '{{PRICE_PER_M_DSP}}',
    },
    countertopPerMeter: {
      dsp: '{{COUNTERTOP_PER_M_DSP}}',
      quartz: '{{COUNTERTOP_PER_M_QUARTZ}}',
    },
    islandSurcharge: '{{ISLAND_SURCHARGE}}',
    wardrobePerMeter: {
      kupe: '{{WARDROBE_PRICE_PER_M_KUPE}}',
      rozpashna: '{{WARDROBE_PRICE_PER_M_ROZPASHNA}}',
      harderobna: '{{WARDROBE_PRICE_PER_M_HARDEROBNA}}',
    },
    from: {
      kitchenPryama: '{{PRICE_FROM_KITCHEN_PRYAMA}}',
      kitchenKutova: '{{PRICE_FROM_KITCHEN_KUTOVA}}',
      kitchenOstriv: '{{PRICE_FROM_KITCHEN_OSTRIV}}',
      wardrobeKupe: '{{PRICE_FROM_WARDROBE_KUPE}}',
      harderobna: '{{PRICE_FROM_HARDEROBNA}}',
      peredpokii: '{{PRICE_FROM_PEREDPOKII}}',
    },
  },

  quiz: {
    kitchenLenMinM: '{{QUIZ_KITCHEN_LEN_MIN_M}}',
    kitchenLenMaxM: '{{QUIZ_KITCHEN_LEN_MAX_M}}',
    wardrobeWidthBands: '{{QUIZ_WARDROBE_WIDTH_BANDS}}',
    priceRound: '{{QUIZ_PRICE_ROUND}}',
    maxRangeRatio: '{{QUIZ_MAX_RANGE_RATIO}}',
    timingSeasonalLabel: '{{QUIZ_TIMING_SEASONAL_LABEL}}',
    facadeTypesConfirmed: '{{FACADE_TYPES_CONFIRMED}}',
    countertopTypesConfirmed: '{{COUNTERTOP_TYPES_CONFIRMED}}',
  },

  // Обещания из ТЗ: на сайт попадут только после подтверждения владельцем
  promises: {
    callbackMinutes: '{{PROMISE_CALLBACK_MINUTES}}',
    measure3dHours: '{{PROMISE_MEASURE_3D_HOURS}}',
    priceFixedText: '{{PROMISE_PRICE_FIXED_TEXT}}',
    gift3dText: '{{PROMISE_3D_GIFT_TEXT}}',
    oneTeam: '{{PROMISE_ONE_TEAM}}',
  },

  terms: {
    stepMeasureDays: '{{TERM_STEP_MEASURE_DAYS}}',
    stepProjectDays: '{{TERM_STEP_PROJECT_DAYS}}',
    stepContractProductionDays: '{{TERM_STEP_CONTRACT_PRODUCTION_DAYS}}',
    stepInstallDays: '{{TERM_STEP_INSTALL_DAYS}}',
    productionDaysTotal: '{{PRODUCTION_DAYS_TOTAL}}',
    measureToInstallDays: '{{TERM_MEASURE_TO_INSTALL_DAYS}}',
  },

  trust: {
    kitchensDone: '{{TRUST_KITCHENS_DONE}}',
    years: '{{TRUST_YEARS}}',
  },

  warranty: {
    years: '{{WARRANTY_YEARS}}',
    terms: '{{WARRANTY_TERMS}}',
  },

  payment: {
    prepayPercent: '{{PAYMENT_PREPAY_PERCENT}}',
    schedule: '{{PAYMENT_SCHEDULE}}',
    methods: '{{PAYMENT_METHODS}}',
  },

  contacts: {
    phoneDisplay: '{{PHONE_DISPLAY}}',
    phoneE164: '{{PHONE_E164}}',
    viberPhoneE164: '{{VIBER_PHONE_E164}}',
    telegramUsername: '{{TELEGRAM_USERNAME}}',
    instagramHandle: '{{INSTAGRAM_HANDLE}}',
    emailPublic: '{{EMAIL_PUBLIC}}',
    scheduleText: '{{SCHEDULE_TEXT}}',
    scheduleSchema: '{{SCHEDULE_SCHEMA}}',
    address: '{{ADDRESS}}',
  },

  serviceArea: {
    text: '{{SERVICE_AREA_TEXT}}',
    terms: '{{SERVICE_AREA_TERMS}}',
    cityDistricts: '{{SERVICE_AREA_CITY_DISTRICTS}}',
    map: '{{SERVICE_AREA_MAP}}',
  },

  google: {
    rating: '{{GOOGLE_RATING}}',
    reviewsCount: '{{GOOGLE_REVIEWS_COUNT}}',
    reviewsUrl: '{{GOOGLE_REVIEWS_URL}}',
    reviewWriteUrl: '{{GOOGLE_REVIEW_WRITE_URL}}',
    mapsUrl: '{{GOOGLE_MAPS_URL}}',
  },

  legal: {
    fopName: '{{FOP_NAME}}',
    fopTaxId: '{{FOP_TAX_ID}}',
    fopAddress: '{{FOP_ADDRESS}}',
    privacyContactEmail: '{{PRIVACY_CONTACT_EMAIL}}',
    privacyUpdatedAt: '{{PRIVACY_UPDATED_AT}}',
  },

  // Вёрстка рассчитана на 2–6 карточек; сейчас 3 заглушки
  team: [1, 2, 3].map(
    (n): TeamMember => ({
      name: `{{MASTER_${n}_NAME}}`,
      role: `{{MASTER_${n}_ROLE}}`,
      years: `{{MASTER_${n}_YEARS}}`,
      quote: `{{MASTER_${n}_QUOTE}}`,
      photo: `{{MASTER_${n}_PHOTO}}`,
    }),
  ),
  // Заголовок блока 6. Пока заглушка — на сайте значение по умолчанию (factDefaults ниже).
  // «Своя бригада» не пишем, пока владелец не подтвердит, что мастера — его сотрудники, а не субподрядчики.
  teamTitle: '{{TEAM_TITLE}}',
  teamVideo: '{{TEAM_VIDEO}}',

  materials: {
    hardwareBrands: '{{HARDWARE_BRANDS}}',
    materialBrands: '{{MATERIAL_BRANDS}}',
  },

  faq: {
    appliances: '{{FAQ_APPLIANCES}}',
  },

  // Только реальные отзывы с согласия авторов
  reviews: [1, 2, 3].map(
    (n): Review => ({
      author: `{{REVIEW_${n}_AUTHOR}}`,
      district: `{{REVIEW_${n}_DISTRICT}}`,
      text: `{{REVIEW_${n}_TEXT}}`,
      source: `{{REVIEW_${n}_SOURCE}}`,
    }),
  ),

  media: {
    hero: '{{HERO_MEDIA}}',
    // Не заглушка, а настройка: рамка фото первого экрана на десктопе.
    // 'portrait' — 4:5 (реальные фото кухонь в основном вертикальные), 'landscape' — 4:3.
    heroOrientation: 'portrait' as HeroOrientation,
    // Не заглушка, а настройка: точка кадра, которая остаётся видна при обрезке фото (CSS object-position).
    // На телефоне фото обрезается до 16:10 — сюда ставим, где на фото главное, например '50% 60%'.
    heroFocus: '50% 50%',
    beforeAfterPairs: '{{BEFORE_AFTER_PAIRS}}',
    ogImage: '{{OG_IMAGE}}',
  },

  seasonalBadgeText: '{{SEASONAL_BADGE_TEXT}}',

  // Не заглушки, а безопасные умолчания (решение владельца: экран Б по умолчанию)
  flags: {
    quizResultVariant: 'B' as 'A' | 'B',
    seasonalBadge: false as boolean,
  },
} satisfies FactsSchema;

/**
 * Значения по умолчанию для заглушек, которые нельзя показывать серой плашкой (например, заголовок блока).
 * Пока заглушка не заменена, на сайте — это значение; check-placeholders всё равно напоминает о нём.
 */
export const factDefaults: Record<string, string> = {
  TEAM_TITLE: 'Наші майстри',
};

interface FactsSchema {
  brand: { name: string; nameUpper: string; descriptor: string };
  prices: {
    perMeter: Record<'mdfFilm' | 'mdfPainted' | 'dsp', Fact<number>>;
    countertopPerMeter: Record<'dsp' | 'quartz', Fact<number>>;
    islandSurcharge: Fact<number>;
    wardrobePerMeter: Record<'kupe' | 'rozpashna' | 'harderobna', Fact<number>>;
    from: Record<
      'kitchenPryama' | 'kitchenKutova' | 'kitchenOstriv' | 'wardrobeKupe' | 'harderobna' | 'peredpokii',
      Fact<number>
    >;
  };
  quiz: {
    kitchenLenMinM: Fact<number>;
    kitchenLenMaxM: Fact<number>;
    wardrobeWidthBands: Fact<WidthBand[]>;
    priceRound: Fact<number>;
    maxRangeRatio: Fact<number>;
    timingSeasonalLabel: Fact<string>;
    facadeTypesConfirmed: Fact<string[]>;
    countertopTypesConfirmed: Fact<string[]>;
  };
  promises: {
    callbackMinutes: Fact<number>;
    measure3dHours: Fact<number>;
    priceFixedText: Fact<string>;
    gift3dText: Fact<string>;
    oneTeam: Fact<string>;
  };
  terms: Record<string, Fact<number>>;
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
  teamVideo: Fact<string>;
  materials: { hardwareBrands: Fact<Brand[]>; materialBrands: Fact<Brand[]> };
  faq: { appliances: Fact<string> };
  reviews: Review[];
  media: { hero: Fact<string>; heroOrientation: HeroOrientation; heroFocus: string; beforeAfterPairs: Fact<string[]>; ogImage: Fact<string> };
  seasonalBadgeText: Fact<string>;
  teamTitle: Fact<string>;
  flags: { quizResultVariant: 'A' | 'B'; seasonalBadge: boolean };
}
