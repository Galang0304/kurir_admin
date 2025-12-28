import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ordersAPI } from '../../services/api';
import { connectSocket, subscribeToOrders, unsubscribeFromOrders, subscribeToWhatsApp, unsubscribeFromWhatsApp, subscribeToMultiBot, unsubscribeFromMultiBot } from '../../services/socket';
import { FiPackage, FiUsers, FiCheckCircle, FiClock, FiArrowRight, FiSmartphone, FiWifi, FiWifiOff, FiRefreshCw, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedToday: 0,
    activeDrivers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // WhatsApp status
  const [whatsappStatus, setWhatsappStatus] = useState({
    isConnected: false,
    qrCode: null,
    connectionInfo: null
  });
  
  // Multi-bot status
  const [multiBotStatus, setMultiBotStatus] = useState({
    bots: {},
    primaryBotId: null
  });

  useEffect(() => {
    fetchData();
    connectSocket();
    
    // Subscribe to orders
    subscribeToOrders((order) => {
      toast.info(`Pesanan baru: ${order.orderNumber}`);
      fetchData();
    });
    
    // Subscribe to WhatsApp status
    subscribeToWhatsApp(
      (status) => {
        console.log('WhatsApp status:', status);
        setWhatsappStatus(status);
      },
      (error) => {
        toast.error(`⚠️ WhatsApp: ${error.message}`);
      }
    );
    
    // Subscribe to Multi-bot status
    subscribeToMultiBot((status) => {
      console.log('Multi-bot status:', status);
      setMultiBotStatus(status);
    });
    
    return () => {
      unsubscribeFromOrders();
      unsubscribeFromWhatsApp();
      unsubscribeFromMultiBot();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        ordersAPI.getStats(),
        ordersAPI.getAll()
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      icon: FiPackage, 
      label: 'Total Pesanan', 
      value: stats.totalOrders, 
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadowColor: 'rgba(102, 126, 234, 0.4)'
    },
    { 
      icon: FiClock, 
      label: 'Menunggu', 
      value: stats.pendingOrders, 
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shadowColor: 'rgba(245, 87, 108, 0.4)'
    },
    { 
      icon: FiCheckCircle, 
      label: 'Selesai Hari Ini', 
      value: stats.completedToday, 
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      shadowColor: 'rgba(79, 172, 254, 0.4)'
    },
    { 
      icon: FiUsers, 
      label: 'Driver Aktif', 
      value: stats.activeDrivers, 
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      shadowColor: 'rgba(67, 233, 123, 0.4)'
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: '#fff3cd', color: '#856404', label: 'Menunggu' },
      assigned: { bg: '#cce5ff', color: '#004085', label: 'Ditugaskan' },
      accepted: { bg: '#d4edda', color: '#155724', label: 'Diterima' },
      picked_up: { bg: '#d1ecf1', color: '#0c5460', label: 'Dijemput' },
      on_delivery: { bg: '#e2d6f8', color: '#6f42c1', label: 'Diantar' },
      completed: { bg: '#d4edda', color: '#155724', label: 'Selesai' },
      cancelled: { bg: '#f8d7da', color: '#721c24', label: 'Dibatalkan' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: config.bg,
        color: config.color,
      }}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Memuat data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard Admin</h1>
        <p style={styles.subtitle}>Selamat datang! Berikut ringkasan aktivitas hari ini.</p>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} style={{
              ...styles.statCard,
              background: stat.gradient,
              boxShadow: `0 10px 30px ${stat.shadowColor}`,
            }}>
              <div style={styles.statIcon}>
                <Icon size={28} />
              </div>
              <div style={styles.statValue}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* WhatsApp Status Card */}
      <div style={styles.whatsappCard}>
        <div style={styles.whatsappHeader}>
          <div style={styles.whatsappTitleContainer}>
            <FiSmartphone size={24} style={{ color: '#25D366' }} />
            <h2 style={styles.whatsappTitle}>WhatsApp Bot</h2>
          </div>
          <div style={{
            ...styles.statusBadge,
            background: whatsappStatus.isConnected ? '#D1FAE5' : '#FEE2E2',
            color: whatsappStatus.isConnected ? '#065F46' : '#991B1B',
          }}>
            {whatsappStatus.isConnected ? (
              <><FiWifi size={14} /> Terhubung</>
            ) : (
              <><FiWifiOff size={14} /> Tidak Terhubung</>
            )}
          </div>
        </div>

        {whatsappStatus.isConnected ? (
          <div style={styles.connectedInfo}>
            <div style={styles.connectedIcon}>✅</div>
            <div style={styles.connectedDetails}>
              <p style={styles.connectedTitle}>WhatsApp Bot Aktif</p>
              {whatsappStatus.connectionInfo && (
                <>
                  <p style={styles.connectedPhone}>
                    📱 {whatsappStatus.connectionInfo.phoneNumber}
                  </p>
                  <p style={styles.connectedName}>
                    👤 {whatsappStatus.connectionInfo.name}
                  </p>
                </>
              )}
              <p style={styles.connectedHint}>Bot siap menerima pesanan dari WhatsApp</p>
            </div>
          </div>
        ) : whatsappStatus.qrCode ? (
          <div style={styles.qrContainer}>
            <p style={styles.qrTitle}>Scan QR Code untuk menghubungkan WhatsApp</p>
            <div style={styles.qrWrapper}>
              <img 
                src={whatsappStatus.qrCode} 
                alt="WhatsApp QR Code" 
                style={styles.qrImage}
              />
            </div>
            <p style={styles.qrHint}>
              Buka WhatsApp di HP Anda → Menu → Perangkat Tertaut → Tautkan Perangkat
            </p>
          </div>
        ) : (
          <div style={styles.waitingContainer}>
            <div style={styles.spinnerSmall}></div>
            <p style={styles.waitingText}>Menunggu QR Code dari bot...</p>
            <p style={styles.waitingHint}>Pastikan WhatsApp bot sudah dijalankan (npm run bot)</p>
          </div>
        )}
      </div>

      {/* Multi-Bot Status Card */}
      {Object.keys(multiBotStatus.bots).length > 0 && (
        <div style={styles.multiBotCard}>
          <div style={styles.whatsappHeader}>
            <div style={styles.whatsappTitleContainer}>
              <FiSmartphone size={24} style={{ color: '#25D366' }} />
              <h2 style={styles.whatsappTitle}>WhatsApp Multi-Bot</h2>
            </div>
            <div style={styles.botCountBadge}>
              {Object.values(multiBotStatus.bots).filter(b => b.status === 'online').length} / {Object.keys(multiBotStatus.bots).length} Online
            </div>
          </div>
          
          <div style={styles.botsGrid}>
            {Object.values(multiBotStatus.bots).map((bot) => (
              <div key={bot.id} style={styles.botCard}>
                <div style={styles.botHeader}>
                  <div style={styles.botName}>
                    {multiBotStatus.primaryBotId === bot.id && (
                      <FiStar size={14} style={{ color: '#F59E0B', marginRight: 4 }} />
                    )}
                    {bot.name}
                  </div>
                  <div style={{
                    ...styles.botStatusBadge,
                    background: bot.status === 'online' ? '#D1FAE5' : bot.status === 'waiting-scan' ? '#FEF3C7' : '#FEE2E2',
                    color: bot.status === 'online' ? '#065F46' : bot.status === 'waiting-scan' ? '#92400E' : '#991B1B',
                  }}>
                    {bot.status === 'online' ? '🟢 Online' : bot.status === 'waiting-scan' ? '🟡 Scan QR' : '🔴 Offline'}
                  </div>
                </div>
                
                {bot.status === 'online' && bot.phone && (
                  <div style={styles.botInfo}>
                    <p style={styles.botPhone}>📱 +{bot.phone}</p>
                    {bot.stats && (
                      <p style={styles.botStats}>📊 Today: {bot.stats.msgDay || 0} msgs</p>
                    )}
                  </div>
                )}
                
                {bot.status === 'waiting-scan' && bot.qrCode && (
                  <div style={styles.botQrContainer}>
                    <img 
                      src={bot.qrCode} 
                      alt={`QR ${bot.name}`}
                      style={styles.botQrImage}
                    />
                    <p style={styles.botQrHint}>Scan untuk connect</p>
                  </div>
                )}
                
                {bot.status !== 'online' && bot.status !== 'waiting-scan' && (
                  <div style={styles.botOffline}>
                    <FiWifiOff size={24} style={{ color: '#9CA3AF' }} />
                    <p>Menunggu koneksi...</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Pesanan Terbaru</h2>
          <Link to="/admin/orders" style={styles.viewAllLink}>
            Lihat Semua <FiArrowRight size={16} />
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <FiPackage size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
            <p style={{ color: '#6b7280', margin: 0 }}>Belum ada pesanan</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>No. Order</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Driver</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.orderNumber}>{order.orderNumber}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.customerInfo}>
                        <span style={styles.customerName}>{order.customerName || 'N/A'}</span>
                        <span style={styles.customerPhone}>{order.customerPhone}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {order.driver?.name || <span style={{ color: '#9ca3af' }}>-</span>}
                    </td>
                    <td style={styles.td}>{getStatusBadge(order.status)}</td>
                    <td style={styles.td}>
                      <span style={styles.timeText}>
                        {new Date(order.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

const styles = {
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 8,
    fontSize: 16,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 24,
    marginBottom: 32,
  },
  statCard: {
    borderRadius: 20,
    padding: 28,
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statValue: {
    fontSize: 42,
    fontWeight: 700,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 15,
    opacity: 0.9,
    fontWeight: 500,
  },
  // WhatsApp Card Styles
  whatsappCard: {
    background: 'white',
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    marginBottom: 32,
    border: '1px solid #E5E7EB',
  },
  whatsappHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  whatsappTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  whatsappTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
  },
  connectedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    padding: 24,
    background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
    borderRadius: 16,
  },
  connectedIcon: {
    fontSize: 48,
  },
  connectedDetails: {
    flex: 1,
  },
  connectedTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#065F46',
    margin: '0 0 8px 0',
  },
  connectedPhone: {
    fontSize: 16,
    color: '#047857',
    margin: '4px 0',
    fontWeight: 600,
  },
  connectedName: {
    fontSize: 14,
    color: '#059669',
    margin: '4px 0',
  },
  connectedHint: {
    fontSize: 13,
    color: '#10B981',
    margin: '8px 0 0 0',
  },
  qrContainer: {
    textAlign: 'center',
    padding: 24,
    background: '#F9FAFB',
    borderRadius: 16,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#374151',
    margin: '0 0 20px 0',
  },
  qrWrapper: {
    display: 'inline-block',
    padding: 16,
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  qrImage: {
    width: 256,
    height: 256,
    display: 'block',
  },
  qrHint: {
    fontSize: 13,
    color: '#6B7280',
    margin: '20px 0 0 0',
    lineHeight: 1.6,
  },
  waitingContainer: {
    textAlign: 'center',
    padding: 40,
    background: '#FEF3C7',
    borderRadius: 16,
  },
  spinnerSmall: {
    width: 32,
    height: 32,
    border: '3px solid #FCD34D',
    borderTopColor: '#F59E0B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  waitingText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#92400E',
    margin: '0 0 8px 0',
  },
  waitingHint: {
    fontSize: 13,
    color: '#B45309',
    margin: 0,
  },
  card: {
    background: 'white',
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  },
  viewAllLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 14,
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 20px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    borderBottom: '2px solid #e5e7eb',
    color: '#6b7280',
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '16px',
    fontSize: 14,
  },
  orderNumber: {
    fontWeight: 600,
    color: '#667eea',
  },
  customerInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  customerName: {
    fontWeight: 500,
    color: '#1f2937',
  },
  customerPhone: {
    fontSize: 13,
    color: '#9ca3af',
  },
  timeText: {
    color: '#6b7280',
    fontSize: 13,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    color: '#6b7280',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: 16,
  },
  // Multi-Bot Styles
  multiBotCard: {
    background: 'white',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  botCountBadge: {
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    background: '#EEF2FF',
    color: '#4F46E5',
  },
  botsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
    marginTop: 20,
  },
  botCard: {
    border: '1px solid #E5E7EB',
    borderRadius: 16,
    padding: 16,
    background: '#FAFAFA',
  },
  botHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  botName: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 15,
    fontWeight: 600,
    color: '#1F2937',
  },
  botStatusBadge: {
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  botInfo: {
    padding: '12px 0',
  },
  botPhone: {
    fontSize: 14,
    color: '#374151',
    margin: '0 0 6px 0',
    fontWeight: 500,
  },
  botStats: {
    fontSize: 13,
    color: '#6B7280',
    margin: 0,
  },
  botQrContainer: {
    textAlign: 'center',
    padding: 12,
    background: 'white',
    borderRadius: 12,
  },
  botQrImage: {
    width: 180,
    height: 180,
    display: 'block',
    margin: '0 auto',
    borderRadius: 8,
  },
  botQrHint: {
    fontSize: 12,
    color: '#6B7280',
    margin: '10px 0 0 0',
  },
  botOffline: {
    textAlign: 'center',
    padding: '20px 12px',
    color: '#9CA3AF',
  },
};

export default AdminDashboard;
