/**
 * KURIRTA WhatsApp Bot - Ultra Anti-Ban Edition
 * Designed for: 20,000+ orders/day, 100+ concurrent
 * Strategy: 1 reply only, queue system, human behavior
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');
const { io } = require('socket.io-client');

// ========== CONFIG ==========
const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// ULTRA SAFE ANTI-BAN
const CONFIG = {
  MIN_DELAY: 3000,          // 3 detik minimum
  MAX_DELAY: 6000,          // 6 detik max
  TYPING_TIME: 2000,        // 2 detik typing
  MAX_PER_MIN: 8,           // 8 pesan/menit (sangat aman)
  MAX_PER_HOUR: 100,        // 100 pesan/jam
  MAX_PER_DAY: 1000,        // 1000 pesan/hari
  USER_COOLDOWN: 60000,     // 1 menit cooldown per user
  SPAM_LIMIT: 6,            // 6 pesan = spam
  SPAM_WINDOW: 60000,       // Window 1 menit
  SPAM_BLOCK: 180000,       // Block 3 menit kalau spam
};

// ========== STATE ==========
const messageQueue = [];
const userLastReply = new Map();
const userCooldownNotified = new Map(); // Track jika sudah kasih tahu cooldown
const userMsgCount = new Map(); // Track jumlah pesan per user
const userSpamBlocked = new Map(); // Track user yang di-block karena spam
const userLastOrder = new Map(); // Track waktu order terakhir per user
const processedMsg = new Set();
const orderWhatsApp = new Map(); // Track WhatsApp ID per ORDER NUMBER (bukan phone)

const ORDER_COOLDOWN = 30000; // 30 detik cooldown antar order

let msgMinute = 0, msgHour = 0, msgDay = 0;
let lastMinReset = Date.now();
let lastHourReset = Date.now();
let lastDayReset = Date.now();
let processing = false;
let ready = false;

// ========== SOCKET ==========
const socket = io(SOCKET_URL);
socket.on('connect', () => console.log('📡 Server connected'));

// Listen untuk notifikasi order di-assign ke driver
socket.on('orderAssigned', async (data) => {
  console.log('📦 Order assigned:', data);
  
  // Cari WhatsApp ID dari order number
  const whatsappId = orderWhatsApp.get(data.orderNumber);
  
  if (whatsappId && data.driver && ready) {
    console.log(`📤 Notifying ${data.orderNumber} via ${whatsappId}`);
    addQueue(whatsappId, 
`🚗 *Driver Sudah Ditugaskan!*

👤 Driver: *${data.driver.name}*
📱 HP: ${data.driver.phone}

Driver akan segera menghubungi kakak.
Terima kasih! 🙏`);
  } else {
    console.log(`⚠️ No WhatsApp ID for order ${data.orderNumber}`);
  }
});

// Listen untuk update status order
socket.on('orderStatusUpdate', async (data) => {
  console.log('📦 Order status update:', data.status);
  
  const whatsappId = orderWhatsApp.get(data.orderNumber);
  
  if (whatsappId && ready) {
    let msg = '';
    switch(data.status) {
      case 'accepted':
        msg = `✅ Driver sudah menerima pesanan kakak dan sedang menuju lokasi!`;
        break;
      case 'completed':
        msg = `🎉 Pesanan selesai! Terima kasih sudah menggunakan KURIRTA. 🙏`;
        // Hapus mapping setelah selesai
        orderWhatsApp.delete(data.orderNumber);
        break;
      case 'cancelled':
        msg = `❌ Pesanan dibatalkan. ${data.cancelReason || ''}\nSilakan pesan lagi ya kak!`;
        orderWhatsApp.delete(data.orderNumber);
        break;
    }
    if (msg) {
      addQueue(whatsappId, msg);
    }
  }
});

// ========== CLIENT ==========
// Detect OS and set Chrome path
const isLinux = process.platform === 'linux';
const chromePath = isLinux 
  ? '/usr/bin/chromium'  // Linux (Kali/Debian)
  : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Windows

// Session path relative to bot folder
const sessionPath = isLinux ? './whatsapp-session' : '../whatsapp-session';

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: sessionPath }),
  puppeteer: {
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  }
});

// ========== HELPERS ==========
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randDelay = () => Math.floor(Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY)) + CONFIG.MIN_DELAY;

function resetLimits() {
  const now = Date.now();
  if (now - lastMinReset > 60000) { msgMinute = 0; lastMinReset = now; }
  if (now - lastHourReset > 3600000) { msgHour = 0; lastHourReset = now; }
  if (now - lastDayReset > 86400000) { msgDay = 0; lastDayReset = now; }
}

function canSend() {
  resetLimits();
  return msgMinute < CONFIG.MAX_PER_MIN && msgHour < CONFIG.MAX_PER_HOUR && msgDay < CONFIG.MAX_PER_DAY;
}

function canReply(chatId) {
  const last = userLastReply.get(chatId);
  return !last || (Date.now() - last) > CONFIG.USER_COOLDOWN;
}

// Hitung sisa waktu cooldown dalam detik
function getRemainingCooldown(chatId) {
  const last = userLastReply.get(chatId);
  if (!last) return 0;
  const remaining = CONFIG.USER_COOLDOWN - (Date.now() - last);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// Cek apakah user spam - BERDASARKAN INTERVAL WAKTU
// Spam = kirim pesan berturut-turut dalam waktu singkat
function isSpammer(chatId) {
  const now = Date.now();
  
  // Cek apakah masih di-block karena spam sebelumnya
  const blockedUntil = userSpamBlocked.get(chatId);
  if (blockedUntil && now < blockedUntil) {
    return true; // Masih di-block
  } else if (blockedUntil) {
    userSpamBlocked.delete(chatId); // Sudah expired, hapus block
  }
  
  // Track waktu pesan terakhir
  let userData = userMsgCount.get(chatId) || { times: [], rapidCount: 0 };
  
  // Tambah waktu sekarang
  userData.times.push(now);
  
  // Simpan hanya 10 pesan terakhir
  if (userData.times.length > 10) {
    userData.times = userData.times.slice(-10);
  }
  
  // Cek rapid fire: 3+ pesan dalam 5 detik = spam
  const recentMsgs = userData.times.filter(t => now - t < 5000);
  if (recentMsgs.length >= 3) {
    userData.rapidCount++;
  }
  
  userMsgCount.set(chatId, userData);
  
  // SPAM jika: kirim 3+ pesan dalam 5 detik, DUA KALI berturut-turut
  if (userData.rapidCount >= 2) {
    userSpamBlocked.set(chatId, now + CONFIG.SPAM_BLOCK);
    userMsgCount.delete(chatId);
    console.log(`🚫 SPAM BLOCKED: ${chatId} (rapid fire x${userData.rapidCount})`);
    return true;
  }
  
  return false;
}

function cleanPhone(p) {
  let c = p.replace(/[^0-9]/g, '');
  if (c.startsWith('0')) c = '62' + c.slice(1);
  return c;
}

// ========== QUEUE ==========
function addQueue(fullChatId, msg) {
  messageQueue.push({ fullChatId, msg, time: Date.now() });
  processQueue();
}

async function processQueue() {
  if (processing || !messageQueue.length || !ready) return;
  processing = true;

  while (messageQueue.length) {
    if (!canSend()) {
      console.log('⏳ Rate limit, waiting 10s...');
      await sleep(10000);
      continue;
    }

    const { fullChatId, msg } = messageQueue.shift();
    try {
      const chat = await client.getChatById(fullChatId);
      await chat.sendStateTyping();
      await sleep(CONFIG.TYPING_TIME);
      await client.sendMessage(fullChatId, msg);
      
      msgMinute++; msgHour++; msgDay++;
      userLastReply.set(fullChatId, Date.now());
      
      console.log(`✅ Sent [${msgMinute}/min ${msgHour}/hr ${msgDay}/day]`);
      await sleep(randDelay());
    } catch (e) {
      console.error(`❌ Send failed:`, e.message);
    }
  }
  processing = false;
}

// ========== API ==========
async function createOrder(phone, name, service) {
  try {
    const res = await axios.post(`${API_URL}/orders`, {
      customerPhone: phone,
      customerName: name,
      serviceType: service,
      pickupAddress: 'Konfirmasi via driver',
      deliveryAddress: 'Konfirmasi via driver',
      orderDetails: service === 'food' ? 'Pesan Makanan' : 'Ojek',
      notes: `Layanan: ${service}`
    });
    return res.data;
  } catch (e) {
    console.error('Order error:', e.response?.data?.message || e.message);
    return null;
  }
}

// Cek pesanan aktif customer
async function getActiveOrders(phone) {
  try {
    const res = await axios.get(`${API_URL}/orders/customer/${phone}`);
    // Filter hanya pesanan aktif (pending, assigned, accepted, picked_up, on_delivery)
    const activeStatuses = ['pending', 'assigned', 'accepted', 'picked_up', 'on_delivery'];
    return res.data.filter(o => activeStatuses.includes(o.status));
  } catch (e) {
    return [];
  }
}

// Cek apakah ada driver tersedia (max 2 order per driver)
async function checkAvailableDrivers() {
  try {
    const res = await axios.get(`${API_URL}/drivers`);
    const drivers = res.data;
    // Filter driver yang aktif dan on duty
    const onDuty = drivers.filter(d => d.isActive && d.isOnDuty);
    // Cari driver yang ordernya < 2 (tersedia)
    const available = onDuty.filter(d => (d.currentOrderCount || 0) < 2);
    return { total: onDuty.length, available: available.length };
  } catch (e) {
    console.error('Check driver error:', e.message);
    return { total: 0, available: 0 };
  }
}

// State untuk tracking user yang sedang konfirmasi order baru
const pendingConfirm = new Map(); // chatId -> { phone, service }

// ========== MESSAGE HANDLER ==========
client.on('message', async (message) => {
  try {
    // Skip broadcast & group
    if (message.from === 'status@broadcast' || message.from.includes('@g.us')) return;
    
    // Prevent duplicate
    const msgId = message.id._serialized;
    if (processedMsg.has(msgId)) return;
    processedMsg.add(msgId);
    
    // Memory cleanup
    if (processedMsg.size > 5000) {
      const arr = Array.from(processedMsg);
      arr.slice(0, 2500).forEach(id => processedMsg.delete(id));
    }

    // Use full chat ID (includes @c.us or @lid)
    const fullChatId = message.from;
    const chatId = fullChatId.replace('@c.us', '').replace('@lid', '');
    
    // 🚫 CEK SPAM DULU - kalau spam, DIAM SAJA tidak balas
    if (isSpammer(fullChatId)) {
      console.log(`🚫 Ignored (spam): ${chatId}`);
      return;
    }

    const text = message.body.trim();
    
    console.log(`📩 ${chatId}: ${text}`);

    // Clean text - hapus formatting WhatsApp (*bold*, _italic_)
    const cleanText = text.replace(/[\*\_\~]/g, '').trim();

    // Parse ORDER dulu - "1 085xxx" atau "2 085xxx" SELALU diproses
    const match = cleanText.match(/^([12])\s*(0[0-9]{9,13})$/);
    
    if (match) {
      // Cek cooldown order (10 detik antar order)
      const lastOrder = userLastOrder.get(fullChatId);
      if (lastOrder && (Date.now() - lastOrder) < ORDER_COOLDOWN) {
        const remaining = Math.ceil((ORDER_COOLDOWN - (Date.now() - lastOrder)) / 1000);
        addQueue(fullChatId, `⏳ Tunggu ${remaining} detik lagi sebelum order berikutnya ya kak.`);
        console.log(`⏳ Order cooldown: ${chatId} (${remaining}s)`);
        return;
      }
      
      // Clear pending confirm jika ada
      pendingConfirm.delete(fullChatId);
      
      const service = match[1] === '1' ? 'food' : 'ride';
      const phone = cleanPhone(match[2]);
      
      // Langsung buat order
      const order = await createOrder(phone, `Customer`, service);
      
      if (order) {
        // Set cooldown order
        userLastOrder.set(fullChatId, Date.now());
        
        // SIMPAN WhatsApp ID berdasarkan ORDER NUMBER (bukan phone)
        orderWhatsApp.set(order.orderNumber, fullChatId);
        console.log(`📱 Saved WhatsApp ID for order ${order.orderNumber}: ${fullChatId}`);
        
        userLastReply.set(fullChatId, Date.now());
        
        const driverInfo = order.driver ? 
          `\n👤 Driver: *${order.driver.name}*\n📱 HP: ${order.driver.phone}` : 
          `\n⏳ Menunggu driver ditugaskan...\nKami akan kabari segera!`;
        
        addQueue(fullChatId, 
`✅ *Pesanan Diterima!*
No. Order: ${order.orderNumber}

Layanan: ${service === 'food' ? '🍔 Makanan' : '🏍️ Ojek'}
No. HP: ${match[2]}${driverInfo}

🚗 *Tunggu ya, segera dihubungi!*
Terima kasih! 🙏`);
      } else {
        addQueue(fullChatId, `❌ Maaf kak, terjadi kesalahan. Silakan coba lagi.`);
      }
      return;
    }

    // Check jika user sedang konfirmasi (YA/TIDAK)
    const pending = pendingConfirm.get(fullChatId);
    if (pending && cleanText.toLowerCase().match(/^(ya|y|yes|ok|iya|oke)$/)) {
      pendingConfirm.delete(fullChatId);
      const order = await createOrder(pending.phone, `Customer`, pending.service);
      if (order) {
        orderWhatsApp.set(order.orderNumber, fullChatId);
        console.log(`📱 Saved WhatsApp ID for order ${order.orderNumber}: ${fullChatId}`);
        userLastReply.set(fullChatId, Date.now());
        addQueue(fullChatId, `✅ Pesanan ${order.orderNumber} dibuat! Driver akan segera menghubungi. 🙏`);
      }
      return;
    }
    
    if (pending && cleanText.toLowerCase().match(/^(tidak|no|tdk|gak|ga|batal)$/)) {
      pendingConfirm.delete(fullChatId);
      addQueue(fullChatId, `👍 OK kak, pesanan dibatalkan.`);
      return;
    }

    // Menu request - check cooldown (prevent spam)
    if (!canReply(fullChatId)) {
      const remaining = getRemainingCooldown(fullChatId);
      const lastNotified = userCooldownNotified.get(fullChatId) || 0;
      
      // Kasih tahu cooldown HANYA SEKALI per cooldown period
      if (Date.now() - lastNotified > 60000) {
        userCooldownNotified.set(fullChatId, Date.now());
        addQueue(fullChatId, `⏳ Tunggu ${remaining} detik lagi ya kak.`);
      }
      console.log(`⏳ Cooldown: ${chatId} (${remaining}s)`);
      return;
    }
    
    // Reset notifikasi cooldown
    userCooldownNotified.delete(fullChatId);

    // Default: Show menu ONCE
    addQueue(fullChatId, 
`Halo kak! 👋 *KURIRTA*

Layanan kami:
*1* 🍔 Pesan Makanan
*2* 🏍️ Ojek

Cara pesan:
Ketik *angka + no HP*
Contoh: *1 085150524668*

Driver langsung hubungi kakak! 🚗`);

  } catch (e) {
    console.error('Handler error:', e.message);
  }
});

// ========== EVENTS ==========
client.on('qr', async (qr) => {
  console.log('📱 Scan QR:');
  qrcode.generate(qr, { small: true });
  
  // Convert QR to base64 for frontend
  try {
    const qrDataUrl = await QRCode.toDataURL(qr);
    socket.emit('whatsapp-qr', qrDataUrl);
    console.log('📤 QR sent to dashboard');
  } catch (err) {
    console.error('QR convert error:', err);
    socket.emit('whatsapp-qr', qr);
  }
});

client.on('authenticated', () => {
  console.log('🔐 Authenticated');
  socket.emit('whatsapp-authenticated');
});

client.on('ready', () => {
  ready = true;
  console.log('✅ Bot Ready (Ultra Anti-Ban)');
  console.log(`📊 Limits: ${CONFIG.MAX_PER_MIN}/min, ${CONFIG.MAX_PER_HOUR}/hr, ${CONFIG.MAX_PER_DAY}/day`);
  socket.emit('whatsapp-ready');
  client.info && console.log(`📱 ${client.info.wid.user}`);
});

client.on('disconnected', reason => {
  ready = false;
  console.log('🔌 Disconnected:', reason);
  socket.emit('whatsapp-disconnected', reason);
});

// ========== CLEANUP ==========
setInterval(() => {
  const old = Date.now() - 86400000;
  for (const [k, v] of userLastReply) {
    if (v < old) userLastReply.delete(k);
  }
}, 1800000);

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  ready = false;
  await client.destroy();
  process.exit(0);
});

// ========== START ==========
console.log('🚀 KURIRTA Bot (Ultra Anti-Ban)');
console.log(`⚙️ Delay: ${CONFIG.MIN_DELAY}-${CONFIG.MAX_DELAY}ms`);
console.log(`⚙️ Cooldown: ${CONFIG.USER_COOLDOWN/60000}min`);
client.initialize();
