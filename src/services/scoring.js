// Multilevel section bands (per 35 questions): B1 38-50 (10-17 correct), B2 51-64 (18-27), C1 65-75 (28-35).
// Linear interpolation between these anchor points. This is an approximation of the official conversion.
const POINTS = [[0, 0], [10, 38], [18, 51], [28, 65], [35, 75]];

const levelFromScore = (s) => (s >= 65 ? 'C1' : s >= 51 ? 'B2' : s >= 38 ? 'B1' : 'BELOW_B1');

function scoreFromCorrect(correct, total) {
  const n = total ? (correct / total) * 35 : 0;
  let score = 75;
  for (let i = 1; i < POINTS.length; i++) {
    const [x0, y0] = POINTS[i - 1];
    const [x1, y1] = POINTS[i];
    if (n <= x1) { score = y0 + ((n - x0) / (x1 - x0)) * (y1 - y0); break; }
  }
  score = Math.round(score);
  return { score, level: levelFromScore(score) };
}

module.exports = { scoreFromCorrect, levelFromScore };
