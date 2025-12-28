/**
 * KURIRTA Multi-Bot Manager
 * Support multiple WhatsApp numbers with auto-failover
 * Jika bot 1 mati, bot 2 otomatis ambil alih
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const axios = require('axios');
const { io } = require('socket.io-client');
const path = require('path');
const fs = require('fs');

// ========== LOAD CONFIG ==========
const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

// Chrome path detection for Linux vs Windows
const os = require('os');
const isLinux = os.platform() === 'linux';
const CHROME_PATH = isLinux 
  ? '/usr/bin/chromium' 
  : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Load config dari file
let botConfig = { bots: [], config: {} };
try {
  const configPath = path.join(__dirname, 'bot-config.json');
  botConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ Config loaded from bot-config.json');
} catch (e) {
  console.log('⚠️ Using default config');
}

// DAFTAR NOMOR BOT - Dari config file
const BOT_SESSIONS = botConfig.bots.filter(b => b.enabled !== false);

// ULTRA SAFE ANTI-BAN
const CONFIG = {
  MIN_DELAY: botConfig.config.minDelay || 3000,
  MAX_DELAY: botConfig.config.maxDelay || 6000,
  TYPING_TIME: botConfig.config.typingTime || 2000,
  MAX_PER_MIN: botConfig.config.maxPerMin || 8,
  MAX_PER_HOUR: botConfig.config.maxPerHour || 100,
  MAX_PER_DAY: botConfig.config.maxPerDay || 1000,
  USER_COOLDOWN: botConfig.config.userCooldown || 60000,
  SPAM_LIMIT: 6,
  SPAM_WINDOW: 60000,
  SPAM_BLOCK: botConfig.config.spamBlock || 180000,
};

const ORDER_COOLDOWN = botConfig.config.orderCooldown || 30000;

// ========== STATE ==========
const bots = new Map(); // Map bot_id -> { client, ready, phone, stats }
let primaryBotId = null; // Bot yang aktif kirim pesan

const messageQueue = [];
const userLastReply = new Map();
const userCooldownNotified = new Map();
const userMsgCount = new Map();
const userSpamBlocked = new Map();
const userLastOrder = new Map();
const processedMsg = new Set();
const orderWhatsApp = new Map();

let processing = false;

// ========== SOCKET ==========
const socket = io(SOCKET_URL);
socket.on('connect', () => console.log('📡 Server connected'));

socket.on('orderAssigned', async (data) => {
  console.log('📦 Order assigned:', data);
  const whatsappId = orderWhatsApp.get(data.orderNumber);
  
  if (whatsappId && data.driver && primaryBotId) {
    console.log(`📤 Notifying ${data.orderNumber} via ${whatsappId}`);
    addQueue(whatsappId, 
`🚗 *Driver Sudah Ditugaskan!*

👤 Driver: *${data.driver.name}*
📱 HP: ${data.driver.phone}

Driver akan segera menghubungi kakak.
Terima kasih! 🙏`);
  }
});

socket.on('orderStatusUpdate', async (data) => {
  console.log('📦 Order status update:', data.status);
  const whatsappId = orderWhatsApp.get(data.orderNumber);
  
  if (whatsappId && primaryBotId) {
    let msg = '';
    switch(data.status) {
      case 'accepted':
        msg = `✅ Driver sudah menerima pesanan kakak dan sedang menuju lokasi!`;
        break;
      case 'completed':
        msg = `🎉 Pesanan selesai! Terima kasih sudah menggunakan KURIRTA. 🙏`;
        orderWhatsApp.delete(data.orderNumber);
        break;
      case 'cancelled':
        msg = `❌ Pesanan dibatalkan. ${data.cancelReason || ''}\nSilakan pesan lagi ya kak!`;
        orderWhatsApp.delete(data.orderNumber);
        break;
    }
    if (msg) addQueue(whatsappId, msg);
  }
});

// ========== HELPERS ==========
const sleep = ms => new Promise(r => setTimeout(r, ms));
const randDelay = () => Math.floor(Math.random() * (CONFIG.MAX_DELAY - CONFIG.MIN_DELAY)) + CONFIG.MIN_DELAY;

function cleanPhone(p) {
  let c = p.replace(/[^0-9]/g, '');
  if (c.startsWith('0')) c = '62' + c.slice(1);
  return c;
}

function canReply(chatId) {
  const last = userLastReply.get(chatId);
  return !last || (Date.now() - last) > CONFIG.USER_COOLDOWN;
}

function getRemainingCooldown(chatId) {
  const last = userLastReply.get(chatId);
  if (!last) return 0;
  const remaining = CONFIG.USER_COOLDOWN - (Date.now() - last);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function isSpammer(chatId) {
  const now = Date.now();
  const blockedUntil = userSpamBlocked.get(chatId);
  if (blockedUntil && now < blockedUntil) return true;
  else if (blockedUntil) userSpamBlocked.delete(chatId);
  
  let userData = userMsgCount.get(chatId) || { times: [], rapidCount: 0 };
  userData.times.push(now);
  if (userData.times.length > 10) userData.times = userData.times.slice(-10);
  
  const recentMsgs = userData.times.filter(t => now - t < 5000);
  if (recentMsgs.length >= 3) userData.rapidCount++;
  
  userMsgCount.set(chatId, userData);
  
  if (userData.rapidCount >= 2) {
    userSpamBlocked.set(chatId, now + CONFIG.SPAM_BLOCK);
    userMsgCount.delete(chatId);
    console.log(`🚫 SPAM BLOCKED: ${chatId}`);
    return true;
  }
  return false;
}

// ========== BOT MANAGEMENT ==========
function getActiveBot() {
  // Cari bot yang ready
  for (const [botId, bot] of bots) {
    if (bot.ready && bot.canSend()) {
      return bot;
    }
  }
  return null;
}

function getPrimaryBot() {
  if (primaryBotId && bots.has(primaryBotId)) {
    const bot = bots.get(primaryBotId);
    if (bot.ready) return bot;
  }
  
  // Primary mati, cari pengganti
  for (const [botId, bot] of bots) {
    if (bot.ready) {
      primaryBotId = botId;
      console.log(`🔄 Switched to ${bot.name} (${bot.phone})`);
      return bot;
    }
  }
  return null;
}

function selectBotForSending() {
  // Prioritas: bot dengan jumlah pesan paling sedikit (load balancing)
  let bestBot = null;
  let minMsgs = Infinity;
  
  for (const [botId, bot] of bots) {
    if (bot.ready && bot.canSend()) {
      if (bot.stats.msgMinute < minMsgs) {
        minMsgs = bot.stats.msgMinute;
        bestBot = bot;
      }
    }
  }
  
  return bestBot;
}

// ========== QUEUE ==========
function addQueue(fullChatId, msg) {
  messageQueue.push({ fullChatId, msg, time: Date.now() });
  processQueue();
}

async function processQueue() {
  if (processing || !messageQueue.length) return;
  
  const bot = selectBotForSending();
  if (!bot) {
    console.log('⚠️ No bot available');
    return;
  }
  
  processing = true;
  
  while (messageQueue.length > 0 && bot.ready && bot.canSend()) {
    const { fullChatId, msg } = messageQueue.shift();
    
    try {
      await sleep(randDelay());
      const chat = await bot.client.getChatById(fullChatId);
      await chat.sendStateTyping();
      await sleep(CONFIG.TYPING_TIME);
      await chat.sendMessage(msg);
      
      bot.stats.msgMinute++;
      bot.stats.msgHour++;
      bot.stats.msgDay++;
      
      console.log(`✅ [${bot.name}] Sent [${bot.stats.msgMinute}/min]`);
    } catch (err) {
      console.error(`❌ [${bot.name}] Send error:`, err.message);
      // Bot error, coba bot lain
      bot.ready = false;
      break;
    }
  }
  
  processing = false;
  if (messageQueue.length > 0) setTimeout(processQueue, 1000);
}

// ========== CREATE BOT ==========
function createBot(botConfig) {
  const { id, name, sessionPath } = botConfig;
  
  console.log(`\n🤖 Initializing ${name}...`);
  
  const client = new Client({
    authStrategy: new LocalAuth({ 
      dataPath: path.join(__dirname, '..', 'whatsapp-sessions', sessionPath)
    }),
    puppeteer: {
      headless: true,
      executablePath: CHROME_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    }
  });
  
  const botState = {
    id,
    name,
    client,
    ready: false,
    phone: null,
    stats: {
      msgMinute: 0,
      msgHour: 0,
      msgDay: 0,
      lastMinReset: Date.now(),
      lastHourReset: Date.now(),
      lastDayReset: Date.now(),
    },
    canSend: function() {
      const now = Date.now();
      if (now - this.stats.lastMinReset > 60000) { this.stats.msgMinute = 0; this.stats.lastMinReset = now; }
      if (now - this.stats.lastHourReset > 3600000) { this.stats.msgHour = 0; this.stats.lastHourReset = now; }
      if (now - this.stats.lastDayReset > 86400000) { this.stats.msgDay = 0; this.stats.lastDayReset = now; }
      return this.stats.msgMinute < CONFIG.MAX_PER_MIN && 
             this.stats.msgHour < CONFIG.MAX_PER_HOUR && 
             this.stats.msgDay < CONFIG.MAX_PER_DAY;
    }
  };
  
  // QR Code
  client.on('qr', async (qr) => {
    console.log(`\n📱 [${name}] Scan QR Code:`);
    qrcode.generate(qr, { small: true });
    
    try {
      const qrBase64 = await QRCode.toDataURL(qr);
      // Kirim ke socket untuk dashboard
      socket.emit('multibot-qr', {
        botId: id,
        botName: name,
        qr: qrBase64
      });
    } catch (e) {
      console.error('QR Error:', e.message);
    }
  });
  
  // Authenticated
  client.on('authenticated', () => {
    console.log(`🔐 [${name}] Authenticated`);
    socket.emit('multibot-status-update', {
      botId: id,
      botName: name,
      status: 'authenticated'
    });
  });
  
  // Ready
  client.on('ready', async () => {
    botState.ready = true;
    botState.phone = client.info?.wid?.user;
    
    console.log(`✅ [${name}] Ready - ${botState.phone}`);
    
    // Set sebagai primary jika belum ada
    if (!primaryBotId) {
      primaryBotId = id;
      console.log(`⭐ [${name}] Set as PRIMARY bot`);
    }
    
    // Notif ke socket untuk dashboard
    socket.emit('multibot-status-update', {
      botId: id,
      botName: name,
      phone: botState.phone,
      status: 'online',
      isPrimary: primaryBotId === id,
      stats: botState.stats
    });
  });
  
  // Disconnected
  client.on('disconnected', async (reason) => {
    console.log(`❌ [${name}] Disconnected: ${reason}`);
    botState.ready = false;
    
    // Ganti primary ke bot lain
    if (primaryBotId === id) {
      primaryBotId = null;
      getPrimaryBot(); // Cari pengganti
    }
    
    // Notif ke socket
    socket.emit('multibot-status-update', {
      botId: id,
      botName: name,
      status: 'offline',
      reason
    });
    
    // Reconnect setelah 10 detik
    console.log(`🔄 [${name}] Reconnecting in 10s...`);
    setTimeout(() => {
      client.initialize();
    }, 10000);
  });
  
  // Handle messages - SEMUA BOT BISA TERIMA, TAPI HANYA SATU YANG PROSES
  client.on('message', async (msg) => {
    // Skip jika bukan primary
    if (primaryBotId !== id && bots.get(primaryBotId)?.ready) {
      return;
    }
    
    if (msg.fromMe || msg.isStatus) return;
    
    const fullChatId = msg.from;
    const userId = fullChatId.split('@')[0];
    const text = msg.body?.trim();
    
    if (!text || processedMsg.has(msg.id._serialized)) return;
    processedMsg.add(msg.id._serialized);
    setTimeout(() => processedMsg.delete(msg.id._serialized), 300000);
    
    console.log(`📩 [${name}] ${userId}: ${text.substring(0, 50)}`);
    
    // Spam check
    if (isSpammer(fullChatId)) {
      console.log(`🚫 Spam blocked: ${userId}`);
      return;
    }
    
    // Cooldown check  
    if (!canReply(fullChatId)) {
      const remaining = getRemainingCooldown(fullChatId);
      if (!userCooldownNotified.get(fullChatId)) {
        addQueue(fullChatId, `⏳ Tunggu ${remaining} detik lagi sebelum pesan berikutnya ya kak.`);
        userCooldownNotified.set(fullChatId, true);
        setTimeout(() => userCooldownNotified.delete(fullChatId), CONFIG.USER_COOLDOWN);
      }
      return;
    }
    
    // Parse order
    const orderMatch = text.match(/^\*?(\d)\s+([\d\s]+)\*?$/);
    
    if (orderMatch) {
      const serviceType = orderMatch[1];
      const phone = cleanPhone(orderMatch[2].replace(/\s/g, ''));
      
      if (!['1', '2'].includes(serviceType)) {
        addQueue(fullChatId, `❌ Layanan tidak valid.\n\n*1* = 🍔 Makanan\n*2* = 🏍️ Ojek`);
        userLastReply.set(fullChatId, Date.now());
        return;
      }
      
      if (phone.length < 10 || phone.length > 15) {
        addQueue(fullChatId, `❌ Format salah!\n\nKetik: *1 08xxx* atau *2 08xxx*`);
        userLastReply.set(fullChatId, Date.now());
        return;
      }
      
      // Order cooldown
      const lastOrder = userLastOrder.get(fullChatId);
      if (lastOrder && (Date.now() - lastOrder) < ORDER_COOLDOWN) {
        const remaining = Math.ceil((ORDER_COOLDOWN - (Date.now() - lastOrder)) / 1000);
        addQueue(fullChatId, `⏳ Tunggu ${remaining} detik lagi sebelum order berikutnya ya kak.`);
        userLastReply.set(fullChatId, Date.now());
        return;
      }
      
      try {
        const res = await axios.post(`${API_URL}/orders`, {
          customerPhone: phone,
          serviceType: serviceType === '1' ? 'Makanan' : 'Ojek'
        });
        
        const orderNumber = res.data.orderNumber || res.data.order?.orderNumber;
        
        if (orderNumber) {
          orderWhatsApp.set(orderNumber, fullChatId);
          userLastOrder.set(fullChatId, Date.now());
          console.log(`📱 Saved WhatsApp ID for order ${orderNumber}`);
        }
        
        const service = serviceType === '1' ? '🍔 Makanan' : '🏍️ Ojek';
        addQueue(fullChatId, 
`✅ *Pesanan Diterima!*
No. Order: *${orderNumber}*

Layanan: ${service}
No. HP: *${phone}*

⏳ Menunggu driver ditugaskan...
Kami akan kabari segera!

🚗 Tunggu ya, segera dihubungi!
Terima kasih! 🙏`);
        
      } catch (err) {
        console.error('Order error:', err.response?.data || err.message);
        addQueue(fullChatId, `❌ Gagal membuat pesanan. Coba lagi nanti.`);
      }
      
    } else {
      // Bukan order, kirim menu
      addQueue(fullChatId, 
`🚗 *KURIRTA - Layanan Kurir*

Ketik format berikut untuk order:
*1 [No HP]* = 🍔 Makanan
*2 [No HP]* = 🏍️ Ojek

Contoh: *1 085150524668*

Kami akan segera menghubungi! 📞`);
    }
    
    userLastReply.set(fullChatId, Date.now());
  });
  
  bots.set(id, botState);
  return client;
}

// ========== STATUS DISPLAY ==========
function displayStatus() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 KURIRTA Multi-Bot Status');
  console.log('='.repeat(50));
  
  for (const [botId, bot] of bots) {
    const status = bot.ready ? '🟢 Online' : '🔴 Offline';
    const primary = primaryBotId === botId ? '⭐ PRIMARY' : '';
    console.log(`${bot.name}: ${status} ${bot.phone || ''} ${primary}`);
    if (bot.ready) {
      console.log(`   📈 Today: ${bot.stats.msgDay} msgs | This hour: ${bot.stats.msgHour}`);
    }
  }
  
  console.log('='.repeat(50) + '\n');
}

// ========== START ==========
async function start() {
  console.log('🚀 KURIRTA Multi-Bot Starting...');
  console.log(`📝 ${BOT_SESSIONS.length} bot(s) configured\n`);
  
  // Initialize semua bot
  for (const botConfig of BOT_SESSIONS) {
    const client = createBot(botConfig);
    client.initialize();
    
    // Delay antar init untuk hindari rate limit
    await sleep(3000);
  }
  
  // Status display setiap 5 menit
  setInterval(displayStatus, 300000);
  
  // Initial status after 30s
  setTimeout(displayStatus, 30000);
}

start();
