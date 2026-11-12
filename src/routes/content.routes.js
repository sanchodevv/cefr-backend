const router = require('express').Router();
const content = require('../controllers/content.controller');
const validate = require('../middleware/validate');
const { contentQuery, idParam } = require('../validators/schemas');

// Public endpoints (no login). Answer keys are never returned here.
for (const name of ['reading', 'listening', 'writing', 'speaking']) {
  router.get(`/${name}`, validate(contentQuery, 'query'), content[name].list);
  router.get(`/${name}/:id`, validate(idParam, 'params'), content[name].get);
}

module.exports = router;
