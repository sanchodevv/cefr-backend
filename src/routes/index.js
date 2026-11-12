const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/content', require('./content.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/submissions', require('./submission.routes'));

module.exports = router;
