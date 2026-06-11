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
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

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
    return res.json({ token, message: 'Giriş başarılı', role: 'admin' });
  }

  const user = db.getUserByEmail(username);
  if (user && user.password === password) {
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    return res.json({ token, message: 'Giriş başarılı', role: 'user', user });
  }

  res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
});

app.post('/api/auth/register', (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Ad soyad, e-posta ve şifre zorunludur' });
  }

  try {
    const user = db.createUser({ fullName, email, password, phone });
    res.status(201).json({ message: 'Kayıt başarıyla oluşturuldu', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/auth/github', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).send('GitHub Client ID is not configured in .env file');
  }
  const redirectUri = `http://localhost:${PORT}/api/auth/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  res.redirect(githubAuthUrl);
});

app.get('/api/auth/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/login.html?error=no_code_provided');
  }

  try {
    const redirectUri = `http://localhost:${PORT}/api/auth/github/callback`;
    
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('GitHub Token Exchange Error:', tokenData);
      return res.redirect('/login.html?error=github_token_failed');
    }

    // 2. Fetch GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Altuğ Yapı OAuth'
      }
    });
    const githubUser = await userResponse.json();

    if (!githubUser.id) {
      return res.redirect('/login.html?error=github_user_failed');
    }

    // 3. Try to get public email if not in profile
    if (!githubUser.email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Altuğ Yapı OAuth'
        }
      });
      const emails = await emailsResponse.json().catch(() => []);
      const primaryEmail = emails.find(e => e.primary && e.verified) || emails[0];
      if (primaryEmail) {
        githubUser.email = primaryEmail.email;
      }
    }

    // 4. Create or Find User in database
    const user = db.findOrCreateGitHubUser(githubUser);

    // 5. Generate session token for our app
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);

    // 6. Redirect to index.html with login params
    const name = encodeURIComponent(user.fullName || user.email);
    const email = encodeURIComponent(user.email);
    res.redirect(`/index.html?oauth_token=${token}&oauth_name=${name}&oauth_email=${email}`);
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.redirect(`/login.html?error=${encodeURIComponent(error.message)}`);
  }
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

app.get('/api/orders', requireAdmin, (_req, res) => {
  res.json(db.getOrders());
});

app.get('/api/categories', (_req, res) => {
  res.json(db.getCategories());
});

app.post('/api/categories', requireAdmin, (req, res) => {
  try {
    const category = db.addCategory(req.body.name);
    res.status(category.alreadyExists ? 200 : 201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/orders', (req, res) => {
  const { items, payment, shippingAddress } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Sepet boş' });
  }

  try {
    const order = db.createOrder(items, payment || {}, shippingAddress || {});
    res.status(201).json({
      orderId: order.id,
      total: order.total,
      items: order.items,
      payment: order.payment,
      shippingAddress: order.shippingAddress
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/orders/admin', requireAdmin, (req, res) => {
  const { items, payment, shippingAddress } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Sipariş için en az bir ürün seçiniz' });
  }

  try {
    const order = db.createOrder(items, payment || {}, shippingAddress || {});
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Altuğ Yapı sunucusu çalışıyor: http://localhost:${PORT}`);
  console.log(`Veritabanı: data/database.json`);
});
