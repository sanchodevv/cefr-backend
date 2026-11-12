const { scoreFromCorrect, levelFromScore } = require('./scoring');
const { examinerFeedback } = require('./ai');

const TIPS = {
  'Main idea': 'Skim the first and last sentence of each paragraph.',
  Detail: 'Scan for keywords, then read around them carefully.',
  Inference: 'Look for what is implied, not stated.',
  Numbers: 'Listen for corrections: speakers often change numbers.',
  General: 'Review the explanations and retry similar questions.',
};

const countWords = (t) => (t.match(/\S+/g) || []).length;

// ---- Reading / Listening: auto-graded ----
function evaluateObjective(questions, answers) {
  let correct = 0;
  const wrong = {};
  const review = questions.map((q) => {
    const given = Number.isInteger(answers[q.id]) ? answers[q.id] : null;
    const isCorrect = given === q.correct;
    if (isCorrect) correct++;
    else { const tag = q.tag || 'General'; wrong[tag] = (wrong[tag] || 0) + 1; }
    return { questionId: q.id, given, correct: q.correct, isCorrect };
  });
  const total = questions.length;
  const { score, level } = scoreFromCorrect(correct, total);
  const errorBreakdown = Object.entries(wrong)
    .map(([tag, count]) => ({ tag, count, tip: TIPS[tag] || TIPS.General }))
    .sort((a, b) => b.count - a.count);
  return { score, level, feedback: { source: 'auto', correct, total, errorBreakdown, review } };
}

// ---- Writing / Speaking: AI examiner with rule-based fallback ----
function heuristic({ text, minWords, checkParagraphs }) {
  const tokens = text.toLowerCase().match(/[a-z']+/g) || [];
  const n = tokens.length;
  const variety = new Set(tokens).size / Math.max(n, 1);
  const errors = [];
  if (n < minWords) errors.push({ category: 'Length', example: `${n} words`, fix: `Aim for at least ${minWords} words.` });
  if (variety < 0.5) errors.push({ category: 'Vocabulary range', example: '', fix: 'Use synonyms instead of repeating the same words.' });
  if (checkParagraphs && !/\n\s*\n/.test(text)) errors.push({ category: 'Paragraphing', example: '', fix: 'Use clear paragraphs: introduction, body, conclusion.' });
  const weak = (text.toLowerCase().match(/\b(very|really|good|bad|nice|thing)\b/g) || []).length;
  if (weak >= 3) errors.push({ category: 'Basic word choice', example: '', fix: 'Replace words like "good" and "very" with precise vocabulary.' });
  const raw = Math.min(1, n / minWords) * 0.6 + Math.min(1, variety / 0.6) * 0.4;
  const score = Math.max(0, Math.min(75, Math.round(raw * 70 - errors.length * 2)));
  return { score, strengths: [], errors, tips: errors.map((e) => e.fix) };
}

async function evaluateProductive({ kind, prompt, text, minWords, checkParagraphs }) {
  const words = countWords(text);
  const ai = await examinerFeedback({ kind, prompt, response: text });
  const body = ai || heuristic({ text, minWords, checkParagraphs });
  const score = Math.max(0, Math.min(75, Math.round(body.score)));
  return {
    score,
    level: levelFromScore(score),
    feedback: { source: ai ? 'ai' : 'rule-based', words, minWords, ...body, score },
  };
}

const evaluateWriting = (task, text) =>
  evaluateProductive({ kind: 'writing', prompt: task.promptText, text, minWords: task.minWords, checkParagraphs: true });

const evaluateSpeaking = (task, transcript) =>
  evaluateProductive({
    kind: 'speaking (transcript)',
    prompt: task.promptParts.map((p) => `Part ${p.part}: ${p.prompt}`).join('\n'),
    text: transcript,
    minWords: 60,
    checkParagraphs: false,
  });

module.exports = { evaluateObjective, evaluateWriting, evaluateSpeaking };
