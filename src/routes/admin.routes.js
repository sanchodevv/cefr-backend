const router = require('express').Router();
const crud = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { idParam, pageQuery, nonEmpty, readingCreate, listeningCreate, writingCreate, speakingCreate } = require('../validators/schemas');

router.use(authenticate, requireRole('ADMIN'));

const resources = {
  'reading-tests': { delegate: 'readingTest', schema: readingCreate },
  'listening-tests': { delegate: 'listeningTest', schema: listeningCreate },
  'writing-tasks': { delegate: 'writingTask', schema: writingCreate },
  'speaking-tasks': { delegate: 'speakingTask', schema: speakingCreate },
};

for (const [path, { delegate, schema }] of Object.entries(resources)) {
  const c = crud(delegate);
  router.get(`/${path}`, validate(pageQuery, 'query'), c.list);
  router.get(`/${path}/:id`, validate(idParam, 'params'), c.get);
  router.post(`/${path}`, validate(schema), c.create);
  router.put(`/${path}/:id`, validate(idParam, 'params'), validate(nonEmpty(schema)), c.update);
  router.delete(`/${path}/:id`, validate(idParam, 'params'), c.remove);
}

module.exports = router;
