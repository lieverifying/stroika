/**
 * Коллекция кейсов портфолио (ARCHITECTURE.md, раздел 3). Один Markdown-файл = один кейс, имя файла = slug.
 * Ошибка в поле роняет сборку с указанием файла и поля — на сайт ничего не попадёт.
 * Демо-кейсы (placeholder: true) и черновики в боевую сборку не идут — фильтр в src/lib/cases.ts.
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const PH = /^\{\{[A-Z0-9_]+\}\}$/;
const ph = z.string().regex(PH, 'ожидается заглушка вида {{NAME}}');
const intOrPh = z.union([z.number().int().positive(), ph]);

/** Есть ли где-то в значении заглушка «{{…}}» */
const hasPlaceholder = (v: unknown): boolean =>
  typeof v === 'string'
    ? v.includes('{{')
    : Array.isArray(v)
      ? v.some(hasPlaceholder)
      : v !== null && typeof v === 'object'
        ? Object.values(v).some(hasPlaceholder)
        : false;

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(70),
        category: z.enum(['kitchen', 'wardrobe', 'renovation']),
        kitchenShape: z.enum(['pryama', 'kutova', 'p-podibna', 'ostriv']).optional(),
        wardrobeType: z.enum(['kupe', 'rozpashna', 'harderobna', 'peredpokii']).optional(),
        district: z.string(),
        altBase: z.string(),
        cover: image().optional(),
        // Точка кадра обложки при обрезке до 4:3 (CSS object-position), как facts.media.heroFocus
        coverFocus: z
          .string()
          .regex(/^\d{1,3}% \d{1,3}%$/, 'coverFocus — два відсотки через пробіл, напр. "50% 60%"')
          .default('50% 50%'),
        gallery: z
          .array(z.object({ src: image(), alt: z.string().optional(), caption: z.string().optional() }))
          .max(15)
          .default([]),
        video: z
          .object({ src: z.string().startsWith('/photos/video/'), poster: image(), title: z.string() })
          .optional(),
        task: z.string(),
        solution: z.string(),
        materials: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
        hardware: z.array(z.string()).optional(),
        durationDays: intOrPh,
        priceFrom: intOrPh.optional(),
        review: z
          .object({
            author: z.string(),
            district: z.string().optional(),
            text: z.string().optional(),
            screenshot: image().optional(),
            source: z.enum(['google', 'instagram', 'other']),
            url: z.url().optional(),
          })
          .optional(),
        related: z.array(reference('cases')).max(3).optional(),
        featured: z.boolean().default(false),
        featuredOrder: z.number().optional(),
        date: z.coerce.date(),
        seo: z
          .object({ title: z.string().max(60).optional(), description: z.string().max(160).optional() })
          .optional(),
        placeholder: z.boolean().default(false),
        draft: z.boolean().default(false),
      })
      .superRefine((c, ctx) => {
        const fail = (path: string, message: string) => ctx.addIssue({ code: 'custom', path: [path], message });
        if (c.category === 'kitchen' && !c.kitchenShape) fail('kitchenShape', 'для кухні потрібна форма kitchenShape');
        if (c.category === 'wardrobe' && !c.wardrobeType) fail('wardrobeType', 'для шафи потрібен тип wardrobeType');
        if (c.review && !c.review.text && !c.review.screenshot)
          fail('review', 'відгук — лише справжній: потрібен text або screenshot');
        if (!c.placeholder) {
          if (!c.cover) fail('cover', 'реальному кейсу потрібна обкладинка cover');
          if (c.gallery.length < 8) fail('gallery', `реальному кейсу потрібно від 8 фото, зараз ${c.gallery.length}`);
          const { placeholder: _p, ...rest } = c;
          if (hasPlaceholder(rest)) fail('placeholder', 'у реальному кейсі лишилась заглушка {{…}}');
        }
      }),
});

export const collections = { cases };
