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
  nextProductId: 9
};

function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
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

function createOrder(items) {
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

  const order = {
    id: db.orders.length + 1,
    total,
    items: orderItems,
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
  createOrder
};
