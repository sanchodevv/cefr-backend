const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Never expose the answer key to students.
const publicQuestions = (qs) => qs.map(({ correct, ...rest }) => rest);

const resources = {
  reading: {
    delegate: 'readingTest',
    filters: ['difficulty'],
    list: { id: true, title: true, difficulty: true, durationMin: true, createdAt: true },
    detail: (r) => ({ id: r.id, title: r.title, difficulty: r.difficulty, durationMin: r.durationMin, passages: r.passages, questions: publicQuestions(r.questions) }),
  },
  listening: {
    delegate: 'listeningTest',
    filters: ['difficulty'],
    list: { id: true, title: true, difficulty: true, durationMin: true, createdAt: true },
    detail: (r) => ({ id: r.id, title: r.title, difficulty: r.difficulty, durationMin: r.durationMin, audioUrl: r.audioUrl, questions: publicQuestions(r.questions) }),
  },
  writing: {
    delegate: 'writingTask',
    filters: ['taskType', 'difficulty'],
    list: { id: true, title: true, taskType: true, difficulty: true, minWords: true },
    detail: (r) => ({ id: r.id, title: r.title, promptText: r.promptText, taskType: r.taskType, difficulty: r.difficulty, minWords: r.minWords }),
  },
  speaking: {
    delegate: 'speakingTask',
    filters: [],
    list: { id: true, title: true, createdAt: true },
    detail: (r) => ({ id: r.id, title: r.title, promptParts: r.promptParts }),
  },
};

const handlers = {};
for (const [name, cfg] of Object.entries(resources)) {
  handlers[name] = {
    list: asyncHandler(async (req, res) => {
      const { page, limit } = req.query;
      const where = { published: true };
      for (const f of cfg.filters) if (req.query[f]) where[f] = req.query[f];
      const [data, total] = await Promise.all([
        prisma[cfg.delegate].findMany({ where, select: cfg.list, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma[cfg.delegate].count({ where }),
      ]);
      res.json({ data, meta: { page, limit, total } });
    }),
    get: asyncHandler(async (req, res) => {
      const item = await prisma[cfg.delegate].findFirst({ where: { id: req.params.id, published: true } });
      if (!item) throw new ApiError(404, 'Not found');
      res.json({ data: cfg.detail(item) });
    }),
  };
}

module.exports = handlers;
