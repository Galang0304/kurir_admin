const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const driverRoutes = require('./routes/driverRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shiftRoutes = require('./routes/shiftRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Add io to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shifts', shiftRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KurirTA API is running' });
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Handle React routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    }
  });
}

// Socket.io connection
let whatsappStatus = {
  isConnected: false,
  qrCode: null,
  connectionInfo: null,
  timestamp: null
};

// Multi-bot status
let multiBotStatus = {
  bots: {}, // { botId: { name, phone, status, qrCode, stats } }
  primaryBotId: null,
  timestamp: null
};

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
    
    // If joining whatsapp-status room, send current status
    if (room === 'whatsapp-status') {
      socket.emit('whatsapp-status', whatsappStatus);
      socket.emit('multibot-status', multiBotStatus);
    }
  });

  // Handle WhatsApp QR Code from bot
  socket.on('whatsapp-qr', (qr) => {
    console.log('📱 QR Code received from bot');
    whatsappStatus.qrCode = qr;
    whatsappStatus.isConnected = false;
    whatsappStatus.timestamp = Date.now();
    io.emit('whatsapp-status', whatsappStatus);
  });

  // Handle WhatsApp authenticated
  socket.on('whatsapp-authenticated', () => {
    console.log('🔐 WhatsApp authenticated');
    whatsappStatus.qrCode = null;
    whatsappStatus.timestamp = Date.now();
    io.emit('whatsapp-status', whatsappStatus);
  });

  // Handle WhatsApp ready
  socket.on('whatsapp-ready', () => {
    console.log('✅ WhatsApp ready');
    whatsappStatus.isConnected = true;
    whatsappStatus.qrCode = null;
    whatsappStatus.timestamp = Date.now();
    io.emit('whatsapp-status', whatsappStatus);
  });

  // Handle WhatsApp disconnected
  socket.on('whatsapp-disconnected', (reason) => {
    console.log('🔌 WhatsApp disconnected:', reason);
    whatsappStatus.isConnected = false;
    whatsappStatus.qrCode = null;
    whatsappStatus.timestamp = Date.now();
    io.emit('whatsapp-status', whatsappStatus);
  });

  // Handle WhatsApp status updates from bot
  socket.on('whatsapp-status', (status) => {
    console.log('📱 WhatsApp status update:', status.isConnected ? 'Connected' : 'Disconnected');
    whatsappStatus = status;
    // Broadcast to all clients in admin room
    io.emit('whatsapp-status', status);
  });

  // ========== MULTI-BOT HANDLERS ==========
  
  // QR Code dari multi-bot
  socket.on('multibot-qr', (data) => {
    console.log(`📱 [${data.botName}] QR Code received`);
    if (!multiBotStatus.bots[data.botId]) {
      multiBotStatus.bots[data.botId] = {};
    }
    multiBotStatus.bots[data.botId] = {
      ...multiBotStatus.bots[data.botId],
      id: data.botId,
      name: data.botName,
      qrCode: data.qr,
      status: 'waiting-scan',
      timestamp: Date.now()
    };
    multiBotStatus.timestamp = Date.now();
    io.emit('multibot-status', multiBotStatus);
  });
  
  // Bot status update
  socket.on('multibot-status-update', (data) => {
    console.log(`📱 [${data.botName}] Status: ${data.status}`);
    if (!multiBotStatus.bots[data.botId]) {
      multiBotStatus.bots[data.botId] = {};
    }
    multiBotStatus.bots[data.botId] = {
      ...multiBotStatus.bots[data.botId],
      id: data.botId,
      name: data.botName,
      phone: data.phone,
      status: data.status,
      stats: data.stats,
      qrCode: data.status === 'online' ? null : multiBotStatus.bots[data.botId]?.qrCode,
      timestamp: Date.now()
    };
    if (data.isPrimary) {
      multiBotStatus.primaryBotId = data.botId;
    }
    multiBotStatus.timestamp = Date.now();
    io.emit('multibot-status', multiBotStatus);
  });
  
  // Request multi-bot status
  socket.on('request-multibot-status', () => {
    socket.emit('multibot-status', multiBotStatus);
  });

  // Handle WhatsApp errors
  socket.on('whatsapp-error', (error) => {
    console.log('⚠️ WhatsApp error:', error.message);
    io.emit('whatsapp-error', error);
  });

  // Request WhatsApp status
  socket.on('request-whatsapp-status', () => {
    io.emit('request-whatsapp-status');
    socket.emit('whatsapp-status', whatsappStatus);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Export io for use in other modules
module.exports = { io };

const PORT = process.env.PORT || 5000;

// Connect to database and start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io ready`);
  });
});
