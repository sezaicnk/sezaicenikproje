const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'database.json');

const defaultData = {
  products: [
    {
      id: 1,
      name: 'Portland Çimento 50kg',
      category: 'Çimento',
      price: 185,
      stock: 250,
      description: 'Yüksek kaliteli Portland çimentosu, tüm inşaat işlerinde kullanıma uygundur.',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80'
    },
    {
      id: 2,
      name: 'İnşaat Demiri 12mm',
      category: 'Demir',
      price: 45,
      stock: 500,
      description: 'TS 708 standartlarına uygun nervürlü inşaat demiri, ton fiyatı.',
      image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80'
    },
    {
      id: 3,
      name: 'Tuğla (Delikli)',
      category: 'Tuğla',
      price: 3.5,
      stock: 10000,
      description: 'Standart delikli tuğla, ısı ve ses yalıtımı sağlar.',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80'
    },
    {
      id: 4,
      name: 'Dış Cephe Boyası 15L',
      category: 'Boya',
      price: 890,
      stock: 80,
      description: 'Silikonlu dış cephe boyası, UV ve yağmur dirençli.',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80'
    },
    {
      id: 5,
      name: 'OSB Levha 18mm',
      category: 'Ahşap',
      price: 320,
      stock: 150,
      description: 'Yönlendirilmiş talaş levhası, çatı ve duvar uygulamaları için.',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80'
    },
    {
      id: 6,
      name: 'Seramik Yapıştırıcı 25kg',
      category: 'Yapıştırıcı',
      price: 145,
      stock: 200,
      description: 'Flex seramik yapıştırıcısı, iç ve dış mekan kullanımına uygun.',
      image: 'https://images.unsplash.com/photo-1615876237396-80a234a9214e?w=400&q=80'
    },
    {
      id: 7,
      name: 'İzolasyon Levhası 5cm',
      category: 'İzolasyon',
      price: 78,
      stock: 300,
      description: 'XPS ısı yalıtım levhası, yüksek basınç dayanımı.',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80'
    },
    {
      id: 8,
      name: 'Kum (m³)',
      category: 'Agrega',
      price: 350,
      stock: 50,
      description: 'Eleklenmiş inşaat kumu, beton ve harç karışımları için.',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'
    }
  ],
  contact_messages: [],
  orders: [],
  users: [],
  categories: ['Çimento', 'Demir', 'Tuğla', 'Boya', 'Ahşap', 'Yapıştırıcı', 'İzolasyon', 'Agrega'],
  nextProductId: 9,
  nextUserId: 1
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function mergeDefaults(data) {
  return {
    ...defaultData,
    ...data,
    products: Array.isArray(data.products) ? data.products : defaultData.products,
    contact_messages: Array.isArray(data.contact_messages) ? data.contact_messages : defaultData.contact_messages,
    orders: Array.isArray(data.orders) ? data.orders : defaultData.orders,
    users: Array.isArray(data.users) ? data.users : defaultData.users,
    categories: Array.isArray(data.categories) && data.categories.length
      ? data.categories
      : defaultData.categories,
    nextProductId: typeof data.nextProductId === 'number' ? data.nextProductId : defaultData.nextProductId,
    nextUserId: typeof data.nextUserId === 'number' ? data.nextUserId : defaultData.nextUserId
  };
}

function readDb() {
  ensureDb();
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const merged = mergeDefaults(data);
  if (JSON.stringify(merged) !== JSON.stringify(data)) {
    fs.writeFileSync(dbPath, JSON.stringify(merged, null, 2), 'utf8');
  }
  return merged;
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

function getProducts() {
  return readDb().products;
}

function getProductById(id) {
  return readDb().products.find(p => p.id === Number(id));
}

function addProduct(product) {
  const db = readDb();
  const newProduct = { ...product, id: db.nextProductId++ };
  db.products.push(newProduct);
  writeDb(db);
  return newProduct;
}

function updateProduct(id, updates) {
  const db = readDb();
  const index = db.products.findIndex(p => p.id === Number(id));
  if (index === -1) return null;
  db.products[index] = { ...db.products[index], ...updates };
  writeDb(db);
  return db.products[index];
}

function deleteProduct(id) {
  const db = readDb();
  const before = db.products.length;
  db.products = db.products.filter(p => p.id !== Number(id));
  if (db.products.length === before) return false;
  writeDb(db);
  return true;
}

function addContactMessage(message) {
  const db = readDb();
  const entry = {
    id: db.contact_messages.length + 1,
    ...message,
    created_at: new Date().toISOString()
  };
  db.contact_messages.push(entry);
  writeDb(db);
  return entry;
}

function getOrders() {
  return readDb().orders;
}

function getCategories() {
  return readDb().categories;
}

function addCategory(name) {
  const db = readDb();
  const normalized = String(name || '').trim();
  if (!normalized) {
    throw new Error('Kategori adı zorunludur');
  }

  if (db.categories.includes(normalized)) {
    return { name: normalized, alreadyExists: true };
  }

  db.categories.push(normalized);
  writeDb(db);
  return { name: normalized, alreadyExists: false };
}

function getUserByEmail(email) {
  return readDb().users.find(user => user.email.toLowerCase() === String(email).toLowerCase());
}

function createUser(user) {
  const db = readDb();
  if (getUserByEmail(user.email)) {
    throw new Error('Bu e-posta ile kayıtlı kullanıcı mevcut');
  }

  const newUser = {
    id: db.nextUserId++,
    fullName: user.fullName || '',
    email: user.email.toLowerCase(),
    password: user.password,
    phone: user.phone || '',
    created_at: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);
  return { id: newUser.id, fullName: newUser.fullName, email: newUser.email, phone: newUser.phone };
}

function findOrCreateGitHubUser(githubProfile) {
  const db = readDb();
  let user = db.users.find(u => 
    u.githubId === githubProfile.id || 
    (githubProfile.email && u.email.toLowerCase() === githubProfile.email.toLowerCase())
  );

  if (!user) {
    user = {
      id: db.nextUserId++,
      fullName: githubProfile.name || githubProfile.login || 'GitHub User',
      email: githubProfile.email || `${githubProfile.login.toLowerCase()}@github.local`,
      password: '',
      githubId: githubProfile.id,
      phone: '',
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    writeDb(db);
  } else if (!user.githubId) {
    user.githubId = githubProfile.id;
    writeDb(db);
  }

  return user;
}

function createOrder(items, payment = {}, shippingAddress = {}) {
  const db = readDb();
  let total = 0;
  const orderItems = [];

  for (const item of items) {
    const product = db.products.find(p => p.id === Number(item.id));
    if (!product) {
      throw new Error(`Ürün bulunamadı: ${item.id}`);
    }

    const quantity = parseInt(item.quantity, 10);
    if (quantity <= 0) continue;

    if (product.stock < quantity) {
      throw new Error(`Stok yetersiz: ${product.name}`);
    }

    product.stock -= quantity;
    total += product.price * quantity;
    orderItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity
    });
  }

  if (orderItems.length === 0) {
    throw new Error('Geçerli ürün bulunamadı');
  }

  const cardNumber = String(payment.cardNumber || '').replace(/\D/g, '');
  const order = {
    id: db.orders.length + 1,
    total,
    items: orderItems,
    payment: {
      cardHolder: payment.cardHolder || 'Belirtilmedi',
      cardNumberLast4: cardNumber.slice(-4) || '****',
      expiry: payment.expiry || '',
      cvv: payment.cvv ? '***' : ''
    },
    shippingAddress: {
      fullName: shippingAddress.fullName || '',
      phone: shippingAddress.phone || '',
      address: shippingAddress.address || '',
      city: shippingAddress.city || '',
      note: shippingAddress.note || ''
    },
    created_at: new Date().toISOString()
  };

  db.orders.push(order);
  writeDb(db);
  return order;
}

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  addContactMessage,
  getOrders,
  getCategories,
  addCategory,
  getUserByEmail,
  createUser,
  findOrCreateGitHubUser,
  createOrder
};
