const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { googleLoginSchema } = require('../validators/schemas');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });

router.post('/google', authLimiter, validate(googleLoginSchema), ctrl.googleLogin);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
