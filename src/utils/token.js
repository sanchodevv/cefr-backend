const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ISSUER = 'cefr-uz';

exports.signToken = (user) =>
  jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: ISSUER,
    algorithm: 'HS256',
  });

exports.verifyToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER, algorithms: ['HS256'] });
