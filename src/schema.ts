import { z } from "zod";

export const readingSchema = z.object({
  referencia: z.string().min(1),
  titulo: z.string().min(1),
  texto: z.string().min(1),
});

export const psalmSchema = z.object({
  referencia: z.string().min(1),
  refrao: z.string().min(1),
  texto: z.string().min(1),
});

export const reflectionSchema = z.object({
  titulo: z.string().min(1),
  autor: z.string().min(1),
  fonte: z.string(),
  texto: z.string().min(1),
  audioUrl: z.string().url().nullable(),
});

export const dailyLiturgySchema = z.object({
  data: z.string().min(1),
  liturgia: z.string().min(1),
  cor: z.string().min(1),
  primeiraLeitura: readingSchema,
  salmo: psalmSchema,
  segundaLeitura: readingSchema.nullable(),
  evangelho: readingSchema,
  reflexao: reflectionSchema,
});

export const saintOfDaySchema = z.object({
  data: z.string().min(1),
  santos: z.array(z.string().min(1)),
});
