require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ensureMongo = require('./ensureMongo');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gawaikita';

const products = [
  {
    name: 'Neonix Aria 12',
    brand: 'Neonix',
    category: 'Smartphone',
    price: 3499000,
    stock: 24,
    specs: { ram: '8GB', storage: '128GB', screenSize: '6.5 inch', battery: '5000mAh' },
    description: 'Smartphone mid-range dengan layar AMOLED 120Hz dan baterai tahan seharian. Dilengkapi kamera 64MP OIS.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
    rating: 4.6
  },
  {
    name: 'Kaira X1 Pro',
    brand: 'Kaira',
    category: 'Smartphone',
    price: 7899000,
    stock: 12,
    specs: { ram: '12GB', storage: '256GB', screenSize: '6.7 inch', battery: '5200mAh' },
    description: 'Flagship kamera 108MP dengan chipset performa tinggi dan fast charging 80W.',
    imageUrl: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600',
    rating: 4.8
  },
  {
    name: 'Kaira X1 Lite',
    brand: 'Kaira',
    category: 'Smartphone',
    price: 2199000,
    stock: 40,
    specs: { ram: '6GB', storage: '128GB', screenSize: '6.4 inch', battery: '4800mAh' },
    description: 'Versi hemat dari seri X1, cocok untuk produktivitas harian dan media sosial.',
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
    rating: 4.1
  },
  {
    name: 'Verlite Book 14',
    brand: 'Verlite',
    category: 'Laptop',
    price: 8999000,
    stock: 8,
    specs: { ram: '16GB', storage: '512GB SSD', screenSize: '14 inch IPS', battery: '54Wh' },
    description: 'Laptop tipis ringan (1.2 kg) dengan prosesor generasi terbaru untuk produktivitas mobile tanpa kompromi.',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
    rating: 4.5
  },
  {
    name: 'Zenoro Slim S3',
    brand: 'Zenoro',
    category: 'Laptop',
    price: 14500000,
    stock: 5,
    specs: { ram: '16GB', storage: '1TB SSD', screenSize: '15.6 inch OLED', battery: '70Wh' },
    description: 'Laptop performa studio dengan layar 4K OLED dan kartu grafis dedicated untuk desainer dan engineer.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
    rating: 4.7
  },
  {
    name: 'Buddi Pulse Watch',
    brand: 'Buddi',
    category: 'Wearable',
    price: 1299000,
    stock: 30,
    specs: { ram: '512MB', storage: '4GB', screenSize: '1.4 inch AMOLED', battery: '300mAh' },
    description: 'Smartwatch pelacak kebugaran dengan SpO2, sensor detak jantung 24/7, dan daya tahan baterai hingga 10 hari.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    rating: 4.3
  },
  {
    name: 'Buddi Track Band Pro',
    brand: 'Buddi',
    category: 'Wearable',
    price: 649000,
    stock: 45,
    specs: { ram: '256MB', storage: '1GB', screenSize: '1.1 inch OLED', battery: '180mAh' },
    description: 'Smartband ringan anti-air 5ATM dengan 30 mode olahraga dan pemantau kualitas tidur presisi.',
    imageUrl: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=600',
    rating: 4.4
  },
  {
    name: 'Orinis TWS Buds',
    brand: 'Orinis',
    category: 'Aksesoris',
    price: 449000,
    stock: 50,
    specs: { ram: '', storage: '', screenSize: '', battery: '400mAh case' },
    description: 'Earbuds nirkabel dengan Active Noise Cancelling (ANC) ringan, bass bertenaga, dan IPX4 splash proof.',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600',
    rating: 4.2
  },
  {
    name: 'Verlite Charger 65W GaN',
    brand: 'Verlite',
    category: 'Aksesoris',
    price: 259000,
    stock: 60,
    specs: { ram: '', storage: '', screenSize: '', battery: '' },
    description: 'Charger cepat teknologi GaN 65W ultra compact dengan 2 port USB-C PD dan 1 port USB-A.',
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600',
    rating: 4.4
  },
  {
    name: 'Neonix PowerCore 20000',
    brand: 'Neonix',
    category: 'Aksesoris',
    price: 399000,
    stock: 35,
    specs: { ram: '', storage: '', screenSize: '', battery: '20000mAh' },
    description: 'Powerbank kapasitas jumbo 20.000mAh dengan pengisian cepat 22.5W dan display digital persentase baterai.',
    imageUrl: 'https://images.unsplash.com/photo-1609592807906-b37130ca781e?w=600',
    rating: 4.5
  }
];

async function seed() {
  await ensureMongo();
  await mongoose.connect(MONGO_URI);
  console.log('✅ Terhubung ke MongoDB, mulai proses seeding...');

  await Product.deleteMany({});
  await User.deleteMany({});
  await Order.deleteMany({});

  const insertedProducts = await Product.insertMany(products);

  const hashedPassword = await bcrypt.hash('password123', 10);
  const admin = await User.create({
    name: 'Admin GawaiKita',
    email: 'admin@gawaikita.test',
    password: hashedPassword,
    role: 'admin',
    phone: '081299887766',
    address: 'HQ GawaiKita, Cyber Tower Lt. 12, Jakarta'
  });

  const customer = await User.create({
    name: 'Angga Yunandana',
    email: 'angga@gawaikita.test',
    password: hashedPassword,
    role: 'customer',
    phone: '081312345678',
    address: 'Jl. Kemang Raya No. 18, Jakarta Selatan'
  });

  // Buat 2 sample order untuk Angga
  await Order.create({
    userId: customer._id,
    customerName: customer.name,
    shippingAddress: customer.address,
    items: [
      {
        productId: insertedProducts[0]._id,
        name: insertedProducts[0].name,
        qty: 1,
        priceAtPurchase: insertedProducts[0].price
      }
    ],
    totalPrice: insertedProducts[0].price,
    status: 'paid',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  });

  await Order.create({
    userId: customer._id,
    customerName: customer.name,
    shippingAddress: customer.address,
    items: [
      {
        productId: insertedProducts[7]._id,
        name: insertedProducts[7].name,
        qty: 1,
        priceAtPurchase: insertedProducts[7].price
      },
      {
        productId: insertedProducts[8]._id,
        name: insertedProducts[8].name,
        qty: 1,
        priceAtPurchase: insertedProducts[8].price
      }
    ],
    totalPrice: insertedProducts[7].price + insertedProducts[8].price,
    status: 'shipped',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  });

  console.log(`✅ Sukses seeding:`);
  console.log(`   - ${insertedProducts.length} Produk gadget`);
  console.log(`   - 2 User (Admin: admin@gawaikita.test | Customer: angga@gawaikita.test, pass: password123)`);
  console.log(`   - 2 Sample Pesanan untuk customer`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed gagal:', err);
  process.exit(1);
});
