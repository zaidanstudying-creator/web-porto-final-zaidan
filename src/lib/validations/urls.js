import { z } from 'zod';

export const externalHttpsUrlSchema = z.string()
  .trim()
  .max(2048)
  .url()
  .superRefine((value, context) => {
    const parsed = new URL(value);

    if (parsed.protocol !== 'https:') {
      context.addIssue({ code: 'custom', message: 'URL harus menggunakan HTTPS.' });
    }

    if (parsed.username || parsed.password) {
      context.addIssue({ code: 'custom', message: 'URL tidak boleh berisi kredensial.' });
    }
  });

const optionalProjectUrlSchema = z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
  externalHttpsUrlSchema.nullable().optional(),
);

export const projectUrlSchema = externalHttpsUrlSchema;

export const projectLinksSchema = z.object({
  github_url: optionalProjectUrlSchema,
  demo_url: optionalProjectUrlSchema,
});

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(1).max(80),
  label: z.string().trim().max(120).optional(),
  url: externalHttpsUrlSchema,
});
