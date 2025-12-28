import { io } from 'socket.io-client';

// In production, connect to same origin. In dev, connect to localhost:5000
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : (process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling']
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const subscribeToOrders = (callback) => {
  socket.on('newOrder', callback);
  socket.on('orderUpdated', callback);
  socket.on('orderAssigned', callback);
};

export const unsubscribeFromOrders = () => {
  socket.off('newOrder');
  socket.off('orderUpdated');
  socket.off('orderAssigned');
};

// WhatsApp status
export const subscribeToWhatsApp = (onStatus, onError) => {
  socket.emit('join', 'whatsapp-status');
  socket.emit('request-whatsapp-status');
  
  socket.on('whatsapp-status', onStatus);
  if (onError) {
    socket.on('whatsapp-error', onError);
  }
};

export const unsubscribeFromWhatsApp = () => {
  socket.off('whatsapp-status');
  socket.off('whatsapp-error');
};

export const requestWhatsAppStatus = () => {
  socket.emit('request-whatsapp-status');
};

// Multi-bot status
export const subscribeToMultiBot = (onStatus) => {
  socket.emit('join', 'whatsapp-status');
  socket.emit('request-multibot-status');
  socket.on('multibot-status', onStatus);
};

export const unsubscribeFromMultiBot = () => {
  socket.off('multibot-status');
};

export const requestMultiBotStatus = () => {
  socket.emit('request-multibot-status');
};
