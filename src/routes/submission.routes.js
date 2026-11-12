const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/submission.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { submissionSchema, pageQuery, idParam } = require('../validators/schemas');

// Evaluation may call a paid AI API, so cap submissions per user (routes below are authenticated first).
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
});

router.use(authenticate);
router.post('/', submitLimiter, validate(submissionSchema), ctrl.create);
router.get('/me', validate(pageQuery, 'query'), ctrl.listMine);
router.get('/me/stats', ctrl.stats);
router.get('/:id', validate(idParam, 'params'), ctrl.getOne);

module.exports = router;
