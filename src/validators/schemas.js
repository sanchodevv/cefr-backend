const { z } = require('zod');

const level = z.enum(['B1', 'B2', 'C1']);
const taskType = z.enum(['TASK_1', 'TASK_2']);

const idParam = z.object({ id: z.string().uuid() });
const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const contentQuery = pageQuery.extend({ difficulty: level.optional(), taskType: taskType.optional() });

const googleLoginSchema = z.object({ credential: z.string().min(20).max(4096) });

// Every question is option-based. `correct` is the index into `options`.
// (MCQ, True/False/Not Given, matching headings and gap-fill-with-options all fit.)
const question = z
  .object({
    id: z.string().min(1).max(40),
    part: z.string().max(120).optional(),
    type: z.enum(['mcq', 'tfng', 'matching', 'gap']).default('mcq'),
    prompt: z.string().min(1).max(1000),
    options: z.array(z.string().min(1).max(300)).min(2).max(8),
    correct: z.number().int().min(0),
    tag: z.string().max(60).default('General'),
  })
  .refine((q) => q.correct < q.options.length, { message: 'correct must be a valid option index', path: ['correct'] });

const questions = z
  .array(question)
  .min(1)
  .max(60)
  .refine((qs) => new Set(qs.map((q) => q.id)).size === qs.length, { message: 'Question ids must be unique' });

const readingCreate = z.object({
  title: z.string().trim().min(1).max(200),
  difficulty: level,
  passages: z
    .array(z.object({ title: z.string().max(200).optional(), text: z.string().min(1).max(20000) }))
    .min(1)
    .max(6),
  questions,
  durationMin: z.number().int().min(1).max(180).default(60),
  published: z.boolean().default(true),
});

const listeningCreate = z.object({
  title: z.string().trim().min(1).max(200),
  difficulty: level,
  audioUrl: z.string().url().max(1000),
  transcript: z.string().max(20000).optional(),
  questions,
  durationMin: z.number().int().min(1).max(180).default(45),
  published: z.boolean().default(true),
});

const writingCreate = z.object({
  title: z.string().trim().min(1).max(200),
  promptText: z.string().trim().min(1).max(5000),
  taskType,
  difficulty: level.optional(),
  minWords: z.number().int().min(20).max(600).default(120),
  published: z.boolean().default(true),
});

const speakingCreate = z.object({
  title: z.string().trim().min(1).max(200),
  promptParts: z
    .array(
      z.object({
        part: z.number().int().min(1).max(3),
        label: z.string().max(80).optional(),
        prompt: z.string().trim().min(1).max(3000),
      }),
    )
    .min(1)
    .max(12),
  published: z.boolean().default(true),
});

const nonEmpty = (schema) => schema.partial().refine((o) => Object.keys(o).length > 0, { message: 'Provide at least one field to update' });

const answersMap = z.record(z.string().max(40), z.number().int().min(0).max(20));
const submissionSchema = z.discriminatedUnion('module', [
  z.object({ module: z.literal('READING'), testId: z.string().uuid(), answers: answersMap }),
  z.object({ module: z.literal('LISTENING'), testId: z.string().uuid(), answers: answersMap }),
  z.object({ module: z.literal('WRITING'), testId: z.string().uuid(), answers: z.object({ text: z.string().trim().min(20).max(8000) }) }),
  z.object({
    module: z.literal('SPEAKING'),
    testId: z.string().uuid(),
    answers: z.object({ transcript: z.string().trim().min(10).max(8000), audioUrl: z.string().url().max(500).optional() }),
  }),
]);

module.exports = {
  idParam, pageQuery, contentQuery, googleLoginSchema, submissionSchema, nonEmpty,
  readingCreate, listeningCreate, writingCreate, speakingCreate,
};
