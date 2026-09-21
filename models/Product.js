const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: {
    type: String,
    enum: ['Smartphone', 'Laptop', 'Aksesoris', 'Wearable'],
    required: true
  },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  specs: {
    ram: { type: String, default: '' },
    storage: { type: String, default: '' },
    screenSize: { type: String, default: '' },
    battery: { type: String, default: '' }
  },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      userName: { type: String, default: 'Pelanggan GawaiKita' },
      rating: { type: Number, min: 1, max: 5, default: 5 },
      comment: { type: String, default: '' },
      adminReply: {
        text: { type: String, default: '' },
        repliedAt: { type: Date }
      },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
