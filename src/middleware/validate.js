// validate(schema, 'body' | 'query' | 'params') - replaces the source with the parsed (sanitised) value.
module.exports = (schema, source = 'body') => (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    next(err);
  }
};
