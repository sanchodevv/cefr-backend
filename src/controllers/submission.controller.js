const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { evaluateObjective, evaluateWriting, evaluateSpeaking } = require('../services/evaluation');
const { levelFromScore } = require('../services/scoring');

const MODULES = {
  READING: { delegate: 'readingTest', fk: 'readingTestId' },
  LISTENING: { delegate: 'listeningTest', fk: 'listeningTestId' },
  WRITING: { delegate: 'writingTask', fk: 'writingTaskId' },
  SPEAKING: { delegate: 'speakingTask', fk: 'speakingTaskId' },
};

exports.create = asyncHandler(async (req, res) => {
  const { module, testId, answers } = req.body;
  const cfg = MODULES[module];

  const test = await prisma[cfg.delegate].findFirst({ where: { id: testId, published: true } });
  if (!test) throw new ApiError(404, 'Test not found');

  let result;
  if (module === 'READING' || module === 'LISTENING') result = evaluateObjective(test.questions, answers);
  else if (module === 'WRITING') result = await evaluateWriting(test, answers.text);
  else result = await evaluateSpeaking(test, answers.transcript);

  const submission = await prisma.submission.create({
    data: {
      userId: req.user.id,
      module,
      [cfg.fk]: test.id,
      testTitle: test.title,
      userAnswers: answers,
      score: result.score,
      level: result.level,
      aiFeedback: result.feedback,
    },
  });
  res.status(201).json({ data: submission });
});

exports.listMine = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const where = { userId: req.user.id };
  const [data, total] = await Promise.all([
    prisma.submission.findMany({ where, orderBy: { submittedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.submission.count({ where }),
  ]);
  res.json({ data, meta: { page, limit, total } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const sub = await prisma.submission.findUnique({ where: { id: req.params.id } });
  // 404 (not 403) so other users' submission ids cannot be probed.
  if (!sub || (sub.userId !== req.user.id && req.user.role !== 'ADMIN')) throw new ApiError(404, 'Submission not found');
  res.json({ data: sub });
});

// Analytics for the AI Tutor / Feedback Hub.
exports.stats = asyncHandler(async (req, res) => {
  const subs = await prisma.submission.findMany({
    where: { userId: req.user.id },
    orderBy: { submittedAt: 'desc' },
    take: 200,
    select: { module: true, score: true, aiFeedback: true },
  });
  const byModule = {};
  const errors = {};
  for (const s of subs) {
    const m = (byModule[s.module] ??= { count: 0, total: 0 });
    m.count++;
    m.total += s.score ?? 0;
    const fb = s.aiFeedback || {};
    if (Array.isArray(fb.errorBreakdown)) for (const e of fb.errorBreakdown) errors[e.tag] = (errors[e.tag] || 0) + e.count;
    if (Array.isArray(fb.errors)) for (const e of fb.errors) errors[e.category] = (errors[e.category] || 0) + 1;
  }
  const modules = Object.entries(byModule).map(([module, m]) => {
    const averageScore = Math.round(m.total / m.count);
    return { module, count: m.count, averageScore, level: levelFromScore(averageScore) };
  });
  const errorBreakdown = Object.entries(errors).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  res.json({ data: { totalSubmissions: subs.length, modules, errorBreakdown } });
});
