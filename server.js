require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

const activeTokens = new Set();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: 'json-file' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    return res.json({ token, message: 'Giriş başarılı' });
  }

  res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
});

app.get('/api/products', (_req, res) => {
  res.json(db.getProducts());
});

app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }
  res.json(product);
});

app.post('/api/products', requireAdmin, (req, res) => {
  const { name, category, price, stock, description, image } = req.body;

  if (!name || !category || price == null || stock == null) {
    return res.status(400).json({ error: 'Eksik alanlar var' });
  }

  const product = db.addProduct({
    name,
    category,
    price: Number(price),
    stock: Math.max(0, parseInt(stock, 10) || 0),
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80'
  });

  res.status(201).json(product);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const existing = db.getProductById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }

  const { name, category, price, stock, description, image } = req.body;
  const product = db.updateProduct(req.params.id, {
    name: name ?? existing.name,
    category: category ?? existing.category,
    price: price ?? existing.price,
    stock: stock ?? existing.stock,
    description: description ?? existing.description,
    image: image ?? existing.image
  });

  res.json(product);
});

app.patch('/api/products/:id/stock', requireAdmin, (req, res) => {
  const existing = db.getProductById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }

  const stock = Math.max(0, parseInt(req.body.stock, 10) || 0);
  const product = db.updateProduct(req.params.id, { stock });
  res.json(product);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Ürün bulunamadı' });
  }
  res.json({ message: 'Ürün silindi' });
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Ad, e-posta ve mesaj zorunludur' });
  }

  db.addContactMessage({ name, email, phone: phone || '', message });
  res.status(201).json({ message: 'Mesajınız kaydedildi' });
});

app.post('/api/orders', (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Sepet boş' });
  }

  try {
    const order = db.createOrder(items);
    res.status(201).json({
      orderId: order.id,
      total: order.total,
      items: order.items
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Altuğ Yapı sunucusu çalışıyor: http://localhost:${PORT}`);
  console.log(`Veritabanı: data/database.json`);
});
