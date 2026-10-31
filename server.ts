import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'monster_store.json');

// Interface definitions
export interface Product {
  id: string;
  name: string;
  category: 'Ultra Series' | 'Juiced Series' | 'Nitro Series' | 'Motorsport Edition' | 'Classic Core' | 'Heritage Series';
  sku: string;
  flavorProfile: string;
  accentColor: string;
  badgeColor: string;
  stock: number;
  totalSold: number;
  stockReceived: number;
  lowStockThreshold: number;
  unitPrice: number;
  costPrice: number;
  canSize: string;
  updatedAt: string;
}

export interface SaleTransaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Digital Pay' | 'Invoice';
  customerNotes?: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  isReversed: boolean;
  reversedAt?: string;
  reversedBy?: string;
}

export interface ActivityLog {
  id: string;
  type: 'sale' | 'restock' | 'damage' | 'adjustment' | 'reversal' | 'user_register' | 'settings_change';
  productId?: string;
  productName?: string;
  quantityChanged: number;
  resultingStock?: number;
  reason: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'staff';
  avatarColor: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface StoreSettings {
  storeName: string;
  defaultLowStockThreshold: number;
  currencySymbol: string;
  canUnitVolume: string;
  soundAlertsEnabled: boolean;
}

interface DatabaseSchema {
  products: Product[];
  sales: SaleTransaction[];
  logs: ActivityLog[];
  users: User[];
  sessions: Record<string, { userId: string; expiresAt: number }>;
  settings: StoreSettings;
}

// 23 Monster products catalogue definition
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'mst-01',
    name: 'Monster Ultra Blue',
    category: 'Ultra Series',
    sku: 'MNST-UB-01',
    flavorProfile: 'Frosty blue raspberry & light citrus zero sugar',
    accentColor: '#00b4d8',
    badgeColor: '#023e8a',
    stock: 28,
    totalSold: 92,
    stockReceived: 120,
    lowStockThreshold: 5,
    unitPrice: 2.99,
    costPrice: 1.45,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-02',
    name: 'Monster Ultra Red',
    category: 'Ultra Series',
    sku: 'MNST-UR-02',
    flavorProfile: 'Crisp berry blend with sweet & tart finish zero sugar',
    accentColor: '#e63946',
    badgeColor: '#9b2226',
    stock: 19,
    totalSold: 77,
    stockReceived: 96,
    lowStockThreshold: 5,
    unitPrice: 2.99,
    costPrice: 1.45,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-03',
    name: 'Monster Ultra Peachy Keen',
    category: 'Ultra Series',
    sku: 'MNST-UPK-03',
    flavorProfile: 'Luscious ripe summer peach with zero sugar burst',
    accentColor: '#f77f00',
    badgeColor: '#d62828',
    stock: 0, // Deliberately 0 to demonstrate Out-of-Stock handling
    totalSold: 114,
    stockReceived: 114,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-04',
    name: 'Monster Ultra Black',
    category: 'Ultra Series',
    sku: 'MNST-UBK-04',
    flavorProfile: 'Deep dark black cherry infusion zero sugar',
    accentColor: '#9d4edd',
    badgeColor: '#3c096c',
    stock: 14,
    totalSold: 62,
    stockReceived: 80,
    lowStockThreshold: 5,
    unitPrice: 3.29,
    costPrice: 1.55,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-05',
    name: 'Monster Ultra Strawberry Dreams',
    category: 'Ultra Series',
    sku: 'MNST-USD-05',
    flavorProfile: 'Dreamy strawberries & sweet cream with zero calories',
    accentColor: '#ff4d6d',
    badgeColor: '#a4133c',
    stock: 4, // Deliberately 4 to demonstrate Low-Stock warning (<= 5)
    totalSold: 138,
    stockReceived: 144,
    lowStockThreshold: 5,
    unitPrice: 3.29,
    costPrice: 1.55,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-06',
    name: 'Monster Super Dry',
    category: 'Nitro Series',
    sku: 'MNST-SD-06',
    flavorProfile: 'Nitrous oxide super dry citrus punch with velvety micro-bubbles',
    accentColor: '#a7c957',
    badgeColor: '#386641',
    stock: 22,
    totalSold: 65,
    stockReceived: 90,
    lowStockThreshold: 5,
    unitPrice: 3.49,
    costPrice: 1.65,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-07',
    name: 'Monster Zero Sugar',
    category: 'Classic Core',
    sku: 'MNST-ZS-07',
    flavorProfile: 'Original legendary Monster flavor with zero sugar & carbs',
    accentColor: '#00ff87',
    badgeColor: '#007f5f',
    stock: 35,
    totalSold: 180,
    stockReceived: 220,
    lowStockThreshold: 5,
    unitPrice: 2.89,
    costPrice: 1.35,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-08',
    name: 'Monster Ultra White',
    category: 'Ultra Series',
    sku: 'MNST-UW-08',
    flavorProfile: 'Crisp, light citrus & sparkling zero ultra profile',
    accentColor: '#e0e1dd',
    badgeColor: '#415a77',
    stock: 46,
    totalSold: 245,
    stockReceived: 300,
    lowStockThreshold: 5,
    unitPrice: 2.89,
    costPrice: 1.35,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-09',
    name: 'Monster Full Throttle',
    category: 'Heritage Series',
    sku: 'MNST-FT-09',
    flavorProfile: 'High-octane original citrus agave blast',
    accentColor: '#d90429',
    badgeColor: '#6a040f',
    stock: 12,
    totalSold: 41,
    stockReceived: 56,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '473ml / 16 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-10',
    name: 'Monster Ultra Rosa',
    category: 'Ultra Series',
    sku: 'MNST-URO-10',
    flavorProfile: 'Bright floral, crisp pink grapefruit & guava zero sugar',
    accentColor: '#ff70a6',
    badgeColor: '#c9184a',
    stock: 26,
    totalSold: 83,
    stockReceived: 110,
    lowStockThreshold: 5,
    unitPrice: 2.99,
    costPrice: 1.45,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-11',
    name: 'Monster Lando Norris',
    category: 'Motorsport Edition',
    sku: 'MNST-LN-11',
    flavorProfile: 'Papaya & neon citrus burst McLaren F1 exclusive edition',
    accentColor: '#ff9f1c',
    badgeColor: '#e85d04',
    stock: 18,
    totalSold: 124,
    stockReceived: 150,
    lowStockThreshold: 5,
    unitPrice: 3.59,
    costPrice: 1.70,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-12',
    name: 'Monster VR46 The Doctor',
    category: 'Motorsport Edition',
    sku: 'MNST-VR-12',
    flavorProfile: 'High-rev Italian citrus lemon & juicy orange MotoGP edition',
    accentColor: '#ffee00',
    badgeColor: '#b5a600',
    stock: 3, // Deliberately 3 to trigger Low Stock
    totalSold: 168,
    stockReceived: 180,
    lowStockThreshold: 5,
    unitPrice: 3.59,
    costPrice: 1.70,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-13',
    name: 'Monster Juiced Monarch',
    category: 'Juiced Series',
    sku: 'MNST-JM-13',
    flavorProfile: 'Subtle peach & nectarine nectar with full juice kick',
    accentColor: '#fb8500',
    badgeColor: '#9d0208',
    stock: 31,
    totalSold: 110,
    stockReceived: 150,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-14',
    name: 'Monster Pipeline Punch',
    category: 'Juiced Series',
    sku: 'MNST-PP-14',
    flavorProfile: 'Hawaiian passion fruit, sweet orange & guava juiced explosion',
    accentColor: '#ff007f',
    badgeColor: '#9b004f',
    stock: 38,
    totalSold: 289,
    stockReceived: 340,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-15',
    name: 'Monster Mango Loco',
    category: 'Juiced Series',
    sku: 'MNST-ML-15',
    flavorProfile: 'Heavenly tropical mango blend inspired by Dia de Los Muertos',
    accentColor: '#00b4d8',
    badgeColor: '#e76f51',
    stock: 42,
    totalSold: 312,
    stockReceived: 370,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-16',
    name: 'Monster Ripper',
    category: 'Juiced Series',
    sku: 'MNST-RP-16',
    flavorProfile: 'Tropical juice & original energy formula with pineapple bite',
    accentColor: '#fca311',
    badgeColor: '#14213d',
    stock: 16,
    totalSold: 75,
    stockReceived: 95,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-17',
    name: 'Monster Juiced Bad Apple',
    category: 'Juiced Series',
    sku: 'MNST-BA-17',
    flavorProfile: 'Sinfully delicious crisp green & red apple cider juice blend',
    accentColor: '#70e000',
    badgeColor: '#38b000',
    stock: 24,
    totalSold: 142,
    stockReceived: 170,
    lowStockThreshold: 5,
    unitPrice: 3.29,
    costPrice: 1.55,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-18',
    name: 'Monster Pacific Punch',
    category: 'Juiced Series',
    sku: 'MNST-PC-18',
    flavorProfile: 'Tattooed vintage classic fruit punch with apple, orange & cherry',
    accentColor: '#d62828',
    badgeColor: '#780000',
    stock: 20,
    totalSold: 98,
    stockReceived: 120,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-19',
    name: 'Monster Rio Punch',
    category: 'Juiced Series',
    sku: 'MNST-RIO-19',
    flavorProfile: 'Carnival punch blend of papaya, blackcurrant & touch of vanilla',
    accentColor: '#06d6a0',
    badgeColor: '#118ab2',
    stock: 27,
    totalSold: 88,
    stockReceived: 120,
    lowStockThreshold: 5,
    unitPrice: 3.29,
    costPrice: 1.55,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-20',
    name: 'Monster Mariposa',
    category: 'Juiced Series',
    sku: 'MNST-MP-20',
    flavorProfile: 'Delicate butterfly peach & nectarine juiced formula',
    accentColor: '#ffb703',
    badgeColor: '#fb8500',
    stock: 15,
    totalSold: 64,
    stockReceived: 80,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-21',
    name: 'Monster Aussie Style Lemonade',
    category: 'Juiced Series',
    sku: 'MNST-ASL-21',
    flavorProfile: 'Australian Great Barrier Reef tart sparkling lemon juice',
    accentColor: '#00a896',
    badgeColor: '#028090',
    stock: 33,
    totalSold: 176,
    stockReceived: 215,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-22',
    name: 'Monster Juiced Khaotic',
    category: 'Juiced Series',
    sku: 'MNST-KH-22',
    flavorProfile: 'Re-engineered legendary Khaos citrus punch fruit burst',
    accentColor: '#ff5400',
    badgeColor: '#9e2a2b',
    stock: 21,
    totalSold: 104,
    stockReceived: 130,
    lowStockThreshold: 5,
    unitPrice: 3.19,
    costPrice: 1.50,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-23',
    name: 'Monster Original Green',
    category: 'Classic Core',
    sku: 'MNST-OG-23',
    flavorProfile: 'The legendary mean green energy tear! Sweet, smooth & vicious',
    accentColor: '#00ff41',
    badgeColor: '#008f11',
    stock: 54,
    totalSold: 460,
    stockReceived: 530,
    lowStockThreshold: 5,
    unitPrice: 2.79,
    costPrice: 1.30,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mst-24',
    name: 'Monster Ultra Watermelon',
    category: 'Ultra Series',
    sku: 'MNST-UWM-24',
    flavorProfile: 'Crisp, sweet, juicy summer watermelon burst with zero sugar',
    accentColor: '#ff2a6d',
    badgeColor: '#05668d',
    stock: 0,
    totalSold: 0,
    stockReceived: 0,
    lowStockThreshold: 5,
    unitPrice: 2.99,
    costPrice: 1.45,
    canSize: '500ml / 16.9 fl oz',
    updatedAt: new Date().toISOString(),
  },
];

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_monster_salt_2026').digest('hex');
}

// Initial Admin and Staff accounts
const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Alex Vance (Chief Ops)',
    email: 'admin@monster.energy',
    passwordHash: hashPassword('Monster2026!'),
    role: 'admin',
    avatarColor: '#00ff41',
    createdAt: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    lastLoginAt: new Date().toISOString(),
  },
  {
    id: 'usr-staff',
    name: 'Jordan Blake (Shift Lead)',
    email: 'staff@monster.energy',
    passwordHash: hashPassword('Monster2026!'),
    role: 'staff',
    avatarColor: '#00b4d8',
    createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Helper to seed recent sales history
function generateInitialSales(): SaleTransaction[] {
  const now = Date.now();
  const sales: SaleTransaction[] = [
    {
      id: 'tx-1001',
      productId: 'mst-23',
      productName: 'Monster Original Green',
      quantity: 4,
      unitPrice: 2.79,
      totalAmount: 11.16,
      paymentMethod: 'Card',
      userId: 'usr-staff',
      userName: 'Jordan Blake (Shift Lead)',
      userEmail: 'staff@monster.energy',
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(), // 12 min ago
      isReversed: false,
    },
    {
      id: 'tx-1002',
      productId: 'mst-15',
      productName: 'Monster Mango Loco',
      quantity: 2,
      unitPrice: 3.19,
      totalAmount: 6.38,
      paymentMethod: 'Digital Pay',
      userId: 'usr-admin',
      userName: 'Alex Vance (Chief Ops)',
      userEmail: 'admin@monster.energy',
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(), // 45 min ago
      isReversed: false,
    },
    {
      id: 'tx-1003',
      productId: 'mst-14',
      productName: 'Monster Pipeline Punch',
      quantity: 6,
      unitPrice: 3.19,
      totalAmount: 19.14,
      paymentMethod: 'Card',
      userId: 'usr-staff',
      userName: 'Jordan Blake (Shift Lead)',
      userEmail: 'staff@monster.energy',
      timestamp: new Date(now - 3 * 3600 * 1000).toISOString(), // 3 hours ago
      isReversed: false,
    },
    {
      id: 'tx-1004',
      productId: 'mst-08',
      productName: 'Monster Ultra White',
      quantity: 12,
      unitPrice: 2.89,
      totalAmount: 34.68,
      paymentMethod: 'Cash',
      customerNotes: 'Gym bulk tray purchase',
      userId: 'usr-admin',
      userName: 'Alex Vance (Chief Ops)',
      userEmail: 'admin@monster.energy',
      timestamp: new Date(now - 5 * 3600 * 1000).toISOString(), // 5 hours ago
      isReversed: false,
    },
    {
      id: 'tx-1005',
      productId: 'mst-17',
      productName: 'Monster Juiced Bad Apple',
      quantity: 3,
      unitPrice: 3.29,
      totalAmount: 9.87,
      paymentMethod: 'Card',
      userId: 'usr-staff',
      userName: 'Jordan Blake (Shift Lead)',
      userEmail: 'staff@monster.energy',
      timestamp: new Date(now - 18 * 3600 * 1000).toISOString(), // Yesterday
      isReversed: false,
    },
    {
      id: 'tx-1006',
      productId: 'mst-12',
      productName: 'Monster VR46 The Doctor',
      quantity: 5,
      unitPrice: 3.59,
      totalAmount: 17.95,
      paymentMethod: 'Card',
      userId: 'usr-staff',
      userName: 'Jordan Blake (Shift Lead)',
      userEmail: 'staff@monster.energy',
      timestamp: new Date(now - 26 * 3600 * 1000).toISOString(), // Yesterday
      isReversed: false,
    },
    {
      id: 'tx-1007',
      productId: 'mst-05',
      productName: 'Monster Ultra Strawberry Dreams',
      quantity: 8,
      unitPrice: 3.29,
      totalAmount: 26.32,
      paymentMethod: 'Digital Pay',
      userId: 'usr-admin',
      userName: 'Alex Vance (Chief Ops)',
      userEmail: 'admin@monster.energy',
      timestamp: new Date(now - 48 * 3600 * 1000).toISOString(), // 2 days ago
      isReversed: false,
    },
    {
      id: 'tx-1008',
      productId: 'mst-21',
      productName: 'Monster Aussie Style Lemonade',
      quantity: 4,
      unitPrice: 3.19,
      totalAmount: 12.76,
      paymentMethod: 'Cash',
      userId: 'usr-staff',
      userName: 'Jordan Blake (Shift Lead)',
      userEmail: 'staff@monster.energy',
      timestamp: new Date(now - 72 * 3600 * 1000).toISOString(), // 3 days ago
      isReversed: false,
    },
    {
      id: 'tx-1009',
      productId: 'mst-23',
      productName: 'Monster Original Green',
      quantity: 24,
      unitPrice: 2.79,
      totalAmount: 66.96,
      paymentMethod: 'Invoice',
      customerNotes: 'Event sponsor pack',
      userId: 'usr-admin',
      userName: 'Alex Vance (Chief Ops)',
      userEmail: 'admin@monster.energy',
      timestamp: new Date(now - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
      isReversed: false,
    },
  ];
  return sales;
}

function generateInitialLogs(): ActivityLog[] {
  const now = Date.now();
  return [
    {
      id: 'log-1',
      type: 'restock',
      productId: 'mst-23',
      productName: 'Monster Original Green',
      quantityChanged: 50,
      resultingStock: 54,
      reason: 'Direct distributor crate shipment received',
      userId: 'usr-admin',
      userName: 'Alex Vance (Chief Ops)',
      timestamp: new Date(now - 6 * 3600 * 1000).toISOString(),
    },
    {
      id: 'log-2',
      type: 'damage',
      productId: 'mst-05',
      productName: 'Monster Ultra Strawberry Dreams',
      quantityChanged: -2,
      resultingStock: 4,
      reason: 'Damaged can seal during pallet unboxing',
      userId: 'usr-staff',
      userName: 'Jordan Blake (Shift Lead)',
      timestamp: new Date(now - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'log-3',
      type: 'sale',
      productId: 'mst-23',
      productName: 'Monster Original Green',
      quantityChanged: -4,
      resultingStock: 54,
      reason: 'Sold 4 cans via Card checkout',
      userId: 'usr-staff',
      userName: 'Jordan Blake (Shift Lead)',
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
    },
  ];
}

// In-Memory Database + File Persistence
let dbState: DatabaseSchema = {
  products: INITIAL_PRODUCTS,
  sales: generateInitialSales(),
  logs: generateInitialLogs(),
  users: INITIAL_USERS,
  sessions: {
    'session-admin-demo': { userId: 'usr-admin', expiresAt: Date.now() + 30 * 86400000 },
    'session-staff-demo': { userId: 'usr-staff', expiresAt: Date.now() + 30 * 86400000 },
  },
  settings: {
    storeName: 'MONSTER STOCK MANAGER',
    defaultLowStockThreshold: 5,
    currencySymbol: '$',
    canUnitVolume: '500ml',
    soundAlertsEnabled: true,
  },
};

// Ensure data folder and load persistence
function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content) as DatabaseSchema;
      // Ensure all 23 initial products exist even if previous schema had fewer
      const existingIds = new Set(parsed.products.map(p => p.name.toLowerCase()));
      INITIAL_PRODUCTS.forEach(p => {
        if (!existingIds.has(p.name.toLowerCase())) {
          parsed.products.push(p);
        }
      });
      dbState = parsed;
      console.log(`[Database] Loaded ${dbState.products.length} products, ${dbState.sales.length} sales from persistent store.`);
    } else {
      saveDatabase();
      console.log(`[Database] Initialized new persistent store at ${DB_FILE}`);
    }
  } catch (err) {
    console.error('[Database] Failed to read database, falling back to memory seed:', err);
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Error saving database:', err);
  }
}

// Mutex / Concurrency Lock for Atomic Operations
let lockPromise = Promise.resolve();
function withLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const result = lockPromise.then(() => fn());
  lockPromise = result.then(() => {}, () => {});
  return result;
}

// Active SSE Connections for Real-Time Synchronisation
const sseClients = new Set<Response>();

function broadcast(eventType: string, payload: any) {
  const data = JSON.stringify({ event: eventType, data: payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep SSE alive every 25s
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(`: ping\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}, 25000);

// Helper to compute summary statistics
function computeStats() {
  let totalStock = 0;
  let totalUnitsSold = 0;
  let totalInventoryValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const p of dbState.products) {
    totalStock += p.stock;
    totalUnitsSold += p.totalSold;
    totalInventoryValue += p.stock * p.unitPrice;
    if (p.stock === 0) {
      outOfStockCount++;
    } else if (p.stock <= (p.lowStockThreshold || dbState.settings.defaultLowStockThreshold)) {
      lowStockCount++;
    }
  }

  // Active sales (non reversed)
  const activeSales = dbState.sales.filter(s => !s.isReversed);
  const now = Date.now();
  const oneDayAgo = now - 24 * 3600000;
  const sevenDaysAgo = now - 7 * 24 * 3600000;
  const thirtyDaysAgo = now - 30 * 24 * 3600000;

  let dailyRevenue = 0;
  let dailyUnits = 0;
  let weeklyRevenue = 0;
  let weeklyUnits = 0;
  let monthlyRevenue = 0;
  let monthlyUnits = 0;
  let totalRevenue = 0;

  for (const s of activeSales) {
    const saleTime = new Date(s.timestamp).getTime();
    totalRevenue += s.totalAmount;

    if (saleTime >= oneDayAgo) {
      dailyRevenue += s.totalAmount;
      dailyUnits += s.quantity;
    }
    if (saleTime >= sevenDaysAgo) {
      weeklyRevenue += s.totalAmount;
      weeklyUnits += s.quantity;
    }
    if (saleTime >= thirtyDaysAgo) {
      monthlyRevenue += s.totalAmount;
      monthlyUnits += s.quantity;
    }
  }

  // Best selling product
  const sortedBySales = [...dbState.products].sort((a, b) => b.totalSold - a.totalSold);
  const bestSeller = sortedBySales[0] || null;

  return {
    totalStock,
    totalUnitsSold,
    totalTransactions: activeSales.length,
    totalRevenue,
    dailyRevenue,
    dailyUnits,
    weeklyRevenue,
    weeklyUnits,
    monthlyRevenue,
    monthlyUnits,
    totalInventoryValue,
    lowStockCount,
    outOfStockCount,
    bestSeller: bestSeller ? { id: bestSeller.id, name: bestSeller.name, totalSold: bestSeller.totalSold } : null,
  };
}

// Authentication Middleware
function getAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const session = dbState.sessions[token];
  if (!session || session.expiresAt < Date.now()) return null;
  const user = dbState.users.find(u => u.id === session.userId);
  return user || null;
}

async function startServer() {
  initDatabase();

  const app = express();
  app.use(express.json());

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health / Ping
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), products: dbState.products.length });
  });

  // Real-Time SSE Stream Endpoint
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);

    // Initial connected message
    res.write(`data: ${JSON.stringify({ event: 'CONNECTED', data: { clientCount: sseClients.size, stats: computeStats() } })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = dbState.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLoginAt = new Date().toISOString();
    const token = crypto.randomUUID();
    dbState.sessions[token] = {
      userId: user.id,
      expiresAt: Date.now() + 30 * 86400000,
    };
    saveDatabase();

    const { passwordHash: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  });

  // Auth: Register New User
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const existing = dbState.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    const newUser: User = {
      id: 'usr-' + crypto.randomUUID().slice(0, 8),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      role: role === 'admin' ? 'admin' : 'staff',
      avatarColor: ['#00ff41', '#00b4d8', '#ff007f', '#ff9f1c', '#a7c957', '#9d4edd'][Math.floor(Math.random() * 6)],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    dbState.users.push(newUser);

    const token = crypto.randomUUID();
    dbState.sessions[token] = {
      userId: newUser.id,
      expiresAt: Date.now() + 30 * 86400000,
    };

    dbState.logs.unshift({
      id: 'log-' + crypto.randomUUID().slice(0, 8),
      type: 'user_register',
      quantityChanged: 0,
      reason: `New user account registered: ${newUser.name} (${newUser.role})`,
      userId: newUser.id,
      userName: newUser.name,
      timestamp: new Date().toISOString(),
    });

    saveDatabase();
    broadcast('USER_JOINED', { user: { id: newUser.id, name: newUser.name, role: newUser.role } });

    const { passwordHash: _, ...userSafe } = newUser;
    res.json({ token, user: userSafe });
  });

  // Auth: Current User Profile
  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const { passwordHash: _, ...userSafe } = user;
    res.json({ user: userSafe });
  });

  // Auth: List Users (for Team page)
  app.get('/api/users', (req, res) => {
    const safeUsers = dbState.users.map(u => {
      // Calculate sales recorded by this user
      const userSales = dbState.sales.filter(s => s.userId === u.id && !s.isReversed);
      const totalUnits = userSales.reduce((sum, s) => sum + s.quantity, 0);
      const totalRev = userSales.reduce((sum, s) => sum + s.totalAmount, 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatarColor: u.avatarColor,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        salesCount: userSales.length,
        unitsSold: totalUnits,
        totalRevenue: totalRev,
      };
    });
    res.json({ users: safeUsers });
  });

  // Inventory: Get all products & stats
  app.get('/api/inventory', (req, res) => {
    res.json({
      products: dbState.products,
      stats: computeStats(),
      settings: dbState.settings,
    });
  });

  // Sales: Get sales transactions
  app.get('/api/sales', (req, res) => {
    res.json({ sales: dbState.sales });
  });

  // Activity Logs
  app.get('/api/logs', (req, res) => {
    res.json({ logs: dbState.logs.slice(0, 100) });
  });

  // Settings
  app.get('/api/settings', (req, res) => {
    res.json({ settings: dbState.settings });
  });

  app.put('/api/settings', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can modify system settings' });
    }

    const { defaultLowStockThreshold, currencySymbol, storeName, soundAlertsEnabled } = req.body;
    if (typeof defaultLowStockThreshold === 'number') {
      dbState.settings.defaultLowStockThreshold = Math.max(1, defaultLowStockThreshold);
    }
    if (currencySymbol) dbState.settings.currencySymbol = currencySymbol;
    if (storeName) dbState.settings.storeName = storeName;
    if (typeof soundAlertsEnabled === 'boolean') dbState.settings.soundAlertsEnabled = soundAlertsEnabled;

    dbState.logs.unshift({
      id: 'log-' + crypto.randomUUID().slice(0, 8),
      type: 'settings_change',
      quantityChanged: 0,
      reason: `Settings updated: Default threshold ${dbState.settings.defaultLowStockThreshold}, Currency ${dbState.settings.currencySymbol}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    saveDatabase();
    broadcast('SETTINGS_UPDATED', { settings: dbState.settings, stats: computeStats() });
    res.json({ settings: dbState.settings });
  });

  // -------------------------------------------------------------
  // ATOMIC MUTATIONS (Protected with Mutex)
  // -------------------------------------------------------------

  // Record Sale: Atomic check and deduct
  app.post('/api/sales/record', async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required to record sales' });

    const { productId, quantity, paymentMethod, customerNotes } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Invalid product or quantity (must be greater than 0)' });
    }

    try {
      const result = await withLock(async () => {
        const product = dbState.products.find(p => p.id === productId);
        if (!product) {
          throw new Error('Flavour not found in catalogue');
        }

        // CRITICAL: Prevent sales exceeding available stock
        if (product.stock < qty) {
          throw new Error(`Insufficient stock. Requested ${qty} cans, but only ${product.stock} cans are available for ${product.name}.`);
        }

        // Atomic inventory update
        product.stock -= qty;
        product.totalSold += qty;
        product.updatedAt = new Date().toISOString();

        const unitPrice = product.unitPrice;
        const totalAmount = parseFloat((unitPrice * qty).toFixed(2));

        const saleRecord: SaleTransaction = {
          id: 'tx-' + crypto.randomUUID().slice(0, 8),
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitPrice,
          totalAmount,
          paymentMethod: paymentMethod || 'Card',
          customerNotes: customerNotes ? String(customerNotes).trim() : undefined,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
          isReversed: false,
        };

        const activityLog: ActivityLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          type: 'sale',
          productId: product.id,
          productName: product.name,
          quantityChanged: -qty,
          resultingStock: product.stock,
          reason: `Sale recorded: ${qty}x ${product.name} (${paymentMethod || 'Card'})`,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
        };

        dbState.sales.unshift(saleRecord);
        dbState.logs.unshift(activityLog);
        saveDatabase();

        const stats = computeStats();
        broadcast('SALE_RECORDED', {
          product,
          sale: saleRecord,
          log: activityLog,
          stats,
        });

        return { product, sale: saleRecord, stats };
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to record sale' });
    }
  });

  // Reverse / Void Sale Transaction
  app.post('/api/sales/:id/reverse', async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const saleId = req.params.id;
    const { reason } = req.body;

    try {
      const result = await withLock(async () => {
        const sale = dbState.sales.find(s => s.id === saleId);
        if (!sale) throw new Error('Sale transaction not found');
        if (sale.isReversed) throw new Error('Transaction has already been reversed / refunded');

        // Restore stock to inventory
        const product = dbState.products.find(p => p.id === sale.productId);
        if (product) {
          product.stock += sale.quantity;
          product.totalSold = Math.max(0, product.totalSold - sale.quantity);
          product.updatedAt = new Date().toISOString();
        }

        sale.isReversed = true;
        sale.reversedAt = new Date().toISOString();
        sale.reversedBy = `${user.name} (${user.role})`;

        const log: ActivityLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          type: 'reversal',
          productId: sale.productId,
          productName: sale.productName,
          quantityChanged: sale.quantity,
          resultingStock: product?.stock,
          reason: `Transaction ${sale.id} reversed: +${sale.quantity} cans returned to inventory. Reason: ${reason || 'Customer cancellation/void'}`,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
        };

        dbState.logs.unshift(log);
        saveDatabase();

        const stats = computeStats();
        broadcast('SALE_REVERSED', { sale, product, log, stats });
        return { sale, product, stats };
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Add Incoming Stock (Restock)
  app.post('/api/inventory/restock', async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const { productId, quantity, notes, supplierBatch } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Invalid incoming stock quantity' });
    }

    try {
      const result = await withLock(async () => {
        const product = dbState.products.find(p => p.id === productId);
        if (!product) throw new Error('Flavour not found');

        product.stock += qty;
        product.stockReceived += qty;
        product.updatedAt = new Date().toISOString();

        const log: ActivityLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          type: 'restock',
          productId: product.id,
          productName: product.name,
          quantityChanged: qty,
          resultingStock: product.stock,
          reason: `Stock received: +${qty} cans${supplierBatch ? ` [Batch: ${supplierBatch}]` : ''}${notes ? ` - ${notes}` : ''}`,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
        };

        dbState.logs.unshift(log);
        saveDatabase();

        const stats = computeStats();
        broadcast('STOCK_UPDATED', { product, log, stats, action: 'restock' });
        return { product, log, stats };
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Remove Damaged / Missing Stock
  app.post('/api/inventory/damage', async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const { productId, quantity, reason } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    try {
      const result = await withLock(async () => {
        const product = dbState.products.find(p => p.id === productId);
        if (!product) throw new Error('Flavour not found');

        if (product.stock < qty) {
          throw new Error(`Cannot write off ${qty} cans. Only ${product.stock} cans currently in stock.`);
        }

        product.stock -= qty;
        product.updatedAt = new Date().toISOString();

        const log: ActivityLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          type: 'damage',
          productId: product.id,
          productName: product.name,
          quantityChanged: -qty,
          resultingStock: product.stock,
          reason: `Damaged/Missing stock write-off: -${qty} cans (${reason || 'Damaged in transit'})`,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
        };

        dbState.logs.unshift(log);
        saveDatabase();

        const stats = computeStats();
        broadcast('STOCK_UPDATED', { product, log, stats, action: 'damage' });
        return { product, log, stats };
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Manual Stock Quantity Override / Calibration
  app.post('/api/inventory/adjust', async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const { productId, newStock, reason } = req.body;
    const targetStock = parseInt(newStock, 10);

    if (!productId || isNaN(targetStock) || targetStock < 0) {
      return res.status(400).json({ error: 'New stock must be a non-negative number' });
    }

    try {
      const result = await withLock(async () => {
        const product = dbState.products.find(p => p.id === productId);
        if (!product) throw new Error('Flavour not found');

        const diff = targetStock - product.stock;
        product.stock = targetStock;
        if (diff > 0) {
          product.stockReceived += diff;
        }
        product.updatedAt = new Date().toISOString();

        const log: ActivityLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          type: 'adjustment',
          productId: product.id,
          productName: product.name,
          quantityChanged: diff,
          resultingStock: targetStock,
          reason: `Manual inventory audit calibration: Stock set to ${targetStock} (${diff >= 0 ? '+' : ''}${diff} adjustment). Reason: ${reason || 'Physical count audit'}`,
          userId: user.id,
          userName: user.name,
          timestamp: new Date().toISOString(),
        };

        dbState.logs.unshift(log);
        saveDatabase();

        const stats = computeStats();
        broadcast('STOCK_UPDATED', { product, log, stats, action: 'adjustment' });
        return { product, log, stats };
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Update Individual Product Details (Threshold, Price, Notes)
  app.put('/api/inventory/:id', async (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const productId = req.params.id;
    const { unitPrice, lowStockThreshold, flavorProfile } = req.body;

    try {
      const result = await withLock(async () => {
        const product = dbState.products.find(p => p.id === productId);
        if (!product) throw new Error('Flavour not found');

        if (typeof unitPrice === 'number' && unitPrice > 0) {
          product.unitPrice = parseFloat(unitPrice.toFixed(2));
        }
        if (typeof lowStockThreshold === 'number' && lowStockThreshold >= 0) {
          product.lowStockThreshold = lowStockThreshold;
        }
        if (flavorProfile) {
          product.flavorProfile = String(flavorProfile).trim();
        }
        product.updatedAt = new Date().toISOString();

        saveDatabase();
        const stats = computeStats();
        broadcast('STOCK_UPDATED', { product, stats, action: 'product_edit' });
        return { product, stats };
      });

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Reset to initial seed catalog (Admin only)
  app.post('/api/admin/reset-catalog', async (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required to reset catalogue' });
    }

    try {
      await withLock(async () => {
        dbState.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
        dbState.sales = generateInitialSales();
        dbState.logs = generateInitialLogs();
        saveDatabase();
        broadcast('CATALOG_RESET', { products: dbState.products, stats: computeStats() });
      });
      res.json({ success: true, message: 'Catalogue reset to 23 default flavours' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Clear All Values: Sets stock, sales, and units to 0 for a clean slate
  app.post('/api/admin/clear-values', async (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin permission required to clear values' });
    }

    try {
      await withLock(async () => {
        // Zero out all 23 products
        dbState.products.forEach((p) => {
          p.stock = 0;
          p.totalSold = 0;
          p.stockReceived = 0;
          p.updatedAt = new Date().toISOString();
        });
        dbState.sales = [];
        dbState.logs = [
          {
            id: 'log-' + crypto.randomUUID().slice(0, 8),
            type: 'adjustment',
            quantityChanged: 0,
            resultingStock: 0,
            reason: 'All inventory stock, sales history, and metrics cleared to zero for fresh operation',
            userId: user.id,
            userName: user.name,
            timestamp: new Date().toISOString(),
          },
        ];
        saveDatabase();
        broadcast('CATALOG_RESET', { products: dbState.products, stats: computeStats() });
      });
      res.json({ success: true, message: 'All inventory quantities, sales records, and statistics cleared to zero.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Backup Export Endpoint
  app.get('/api/admin/export', (req, res) => {
    res.setHeader('Content-Disposition', 'attachment; filename="monster-stock-backup.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(dbState, null, 2));
  });

  // -------------------------------------------------------------
  // FRONTEND INTEGRATION (Vite Middleware in Dev / Static in Prod)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ MONSTER STOCK MANAGER server online at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
