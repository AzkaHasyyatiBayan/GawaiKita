const Joi = require('joi');

// Skema ini SENGAJA ketat: setiap field harus string/number murni.
// Kalau payload NoSQL (mis. { "$ne": null }) masuk ke sini, Joi akan
// menolaknya karena tipe datanya object, bukan string/number seperti yang diharapkan.

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().max(20).optional().allow(''),
  address: Joi.string().max(300).optional().allow('')
  // Tidak ada field 'role' — Joi akan otomatis menolak jika penyerang mencoba Mass Assignment
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(4).required()
});

const productFilterSchema = Joi.object({
  minPrice: Joi.alternatives().try(Joi.number().min(0), Joi.string().pattern(/^[0-9]*$/)).optional(),
  maxPrice: Joi.alternatives().try(Joi.number().min(0), Joi.string().pattern(/^[0-9]*$/)).optional(),
  brand: Joi.string().pattern(/^[a-zA-Z0-9\s,.-]+$/).max(100).optional().allow(''),
  category: Joi.string()
    .valid('Smartphone', 'Laptop', 'Aksesoris', 'Wearable', '')
    .optional(),
  sort: Joi.string().valid('termurah', 'termahal', 'terbaru', '').optional(),
  // Pola regex dibatasi pada karakter teks aman untuk memitigasi ReDoS (Regular Expression Denial of Service)
  q: Joi.string().pattern(/^[a-zA-Z0-9\s.,_-]*$/).max(100).optional().allow('')
});

const orderFilterSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'paid', 'shipped', 'completed', '')
    .optional(),
  userId: Joi.string().hex().length(24).optional().allow('')
});

const adminUserSearchSchema = Joi.object({
  // Pola regex dibatasi pada karakter teks/email aman untuk memitigasi ReDoS & Wildcard Harvesting
  search: Joi.string().pattern(/^[a-zA-Z0-9\s.,_@ -]*$/).max(100).optional().allow('')
});

module.exports = {
  registerSchema,
  loginSchema,
  productFilterSchema,
  orderFilterSchema,
  adminUserSearchSchema
};
