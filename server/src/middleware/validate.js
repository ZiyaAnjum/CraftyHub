export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Please check your input.',
      details: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  req.body = result.data; // only validated, whitelisted fields continue
  next();
};
