// Middleware generik: validasi req.query atau req.body terhadap skema Joi.
// Kalau validate=false (varian V0/V1), middleware ini di-skip sama sekali
// di level route factory (routes/apiFactory.js), bukan di sini.

function validate(schema, source = 'query') {
  return (req, res, next) => {
    const target = source === 'body' ? req.body : req.query;
    const { error, value } = schema.validate(target, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validasi input gagal',
        details: error.details.map((d) => d.message)
      });
    }

    // ganti dengan hasil yang sudah divalidasi & di-cast (mis. string angka -> number)
    if (source === 'body') req.body = value;
    else req.query = value;

    next();
  };
}

module.exports = validate;
