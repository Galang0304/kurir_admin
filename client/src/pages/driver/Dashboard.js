import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ordersAPI, driversAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, subscribeToOrders, unsubscribeFromOrders } from '../../services/socket';
import { toast } from 'react-toastify';
import { FiPackage, FiCheckCircle, FiClock, FiPower, FiMapPin, FiPhone, FiArrowRight } from 'react-icons/fi';

const DriverDashboard = () => {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState({
    activeOrders: 0,
    completedToday: 0,
    totalCompleted: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnDuty, setIsOnDuty] = useState(user?.isOnDuty || false);

  useEffect(() => {
    fetchData();
    
    connectSocket();
    subscribeToOrders((order) => {
      if (order.driverId === user?.id) {
        toast.info(`Pesanan baru: ${order.orderNumber}`);
        fetchData();
      }
    });

    return () => {
      unsubscribeFromOrders();
    };
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const ordersRes = await ordersAPI.getByDriver(user.id);
      const orders = ordersRes.data;
      
      const today = new Date().toISOString().split('T')[0];
      const activeOrders = orders.filter(o => 
        ['assigned', 'accepted', 'picked_up', 'on_delivery'].includes(o.status)
      );
      const completedToday = orders.filter(o => 
        o.status === 'completed' && 
        o.completedAt?.startsWith(today)
      );

      setStats({
        activeOrders: activeOrders.length,
        completedToday: completedToday.length,
        totalCompleted: orders.filter(o => o.status === 'completed').length
      });
      
      setRecentOrders(activeOrders.slice(0, 5));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDuty = async () => {
    try {
      await driversAPI.toggleDuty(user.id);
      const newStatus = !isOnDuty;
      setIsOnDuty(newStatus);
      updateUser({ ...user, isOnDuty: newStatus });
      toast.success(newStatus ? 'Anda sekarang On Duty!' : 'Anda sekarang Off Duty');
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Menunggu' },
      assigned: { bg: '#DBEAFE', color: '#1E40AF', text: 'Ditugaskan' },
      accepted: { bg: '#D1FAE5', color: '#065F46', text: 'Diterima' },
      picked_up: { bg: '#E0E7FF', color: '#3730A3', text: 'Dijemput' },
      on_delivery: { bg: '#FEE2E2', color: '#991B1B', text: 'Diantar' },
      completed: { bg: '#D1FAE5', color: '#065F46', text: 'Selesai' },
      cancelled: { bg: '#FEE2E2', color: '#991B1B', text: 'Dibatalkan' }
    };
    return statusMap[status] || { bg: '#F3F4F6', color: '#374151', text: status };
  };

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    greeting: {
      marginBottom: '24px',
    },
    greetingTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: '4px',
    },
    greetingSubtitle: {
      fontSize: '16px',
      color: '#6B7280',
    },
    statusCard: {
      background: isOnDuty 
        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
      borderRadius: '20px',
      padding: '28px',
      marginBottom: '24px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
    },
    statusInfo: {
      color: 'white',
    },
    statusTitle: {
      fontSize: '14px',
      fontWeight: '500',
      opacity: 0.9,
      marginBottom: '4px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    statusText: {
      fontSize: '24px',
      fontWeight: '700',
    },
    statusDesc: {
      fontSize: '14px',
      opacity: 0.85,
      marginTop: '4px',
    },
    toggleButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 32px',
      borderRadius: '50px',
      border: 'none',
      fontSize: '16px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      background: isOnDuty ? 'rgba(255,255,255,0.2)' : 'white',
      color: isOnDuty ? 'white' : '#374151',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '24px',
    },
    statCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #F3F4F6',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    statHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    },
    statIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '22px',
    },
    statValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#1F2937',
    },
    statLabel: {
      fontSize: '14px',
      color: '#6B7280',
      marginTop: '4px',
    },
    ordersSection: {
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #F3F4F6',
    },
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1F2937',
    },
    viewAllLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#6366F1',
      fontSize: '14px',
      fontWeight: '600',
      textDecoration: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      background: '#EEF2FF',
      transition: 'all 0.2s ease',
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: '#9CA3AF',
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px',
      opacity: 0.5,
    },
    orderCard: {
      background: '#F9FAFB',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid #E5E7EB',
      transition: 'all 0.2s ease',
    },
    orderHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    },
    orderNumber: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1F2937',
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
    },
    orderDetail: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginBottom: '8px',
      fontSize: '14px',
      color: '#4B5563',
    },
    orderIcon: {
      marginTop: '2px',
      flexShrink: 0,
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '300px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #E5E7EB',
      borderTopColor: '#6366F1',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Driver">
      <div style={styles.container}>
        {/* Greeting */}
        <div style={styles.greeting}>
          <h1 style={styles.greetingTitle}>Halo, {user?.name || 'Driver'}! 👋</h1>
          <p style={styles.greetingSubtitle}>Berikut ringkasan aktivitas Anda hari ini</p>
        </div>

        {/* Status Toggle Card */}
        <div style={styles.statusCard}>
          <div style={styles.statusInfo}>
            <p style={styles.statusTitle}>Status Anda</p>
            <p style={styles.statusText}>
              {isOnDuty ? '🟢 ON DUTY' : '🔴 OFF DUTY'}
            </p>
            <p style={styles.statusDesc}>
              {isOnDuty ? 'Anda siap menerima pesanan baru' : 'Anda tidak menerima pesanan'}
            </p>
          </div>
          <button
            onClick={handleToggleDuty}
            style={styles.toggleButton}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            <FiPower size={22} />
            {isOnDuty ? 'Matikan' : 'Aktifkan'}
          </button>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white'}}>
                <FiPackage />
              </div>
            </div>
            <div style={styles.statValue}>{stats.activeOrders}</div>
            <div style={styles.statLabel}>Order Aktif</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white'}}>
                <FiCheckCircle />
              </div>
            </div>
            <div style={styles.statValue}>{stats.completedToday}</div>
            <div style={styles.statLabel}>Selesai Hari Ini</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: 'white'}}>
                <FiClock />
              </div>
            </div>
            <div style={styles.statValue}>{stats.totalCompleted}</div>
            <div style={styles.statLabel}>Total Selesai</div>
          </div>
        </div>

        {/* Active Orders */}
        <div style={styles.ordersSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>📦 Pesanan Aktif</h2>
            <a href="/driver/orders" style={styles.viewAllLink}>
              Lihat Semua <FiArrowRight />
            </a>
          </div>

          {recentOrders.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <p>Tidak ada pesanan aktif</p>
              <p style={{fontSize: '14px', marginTop: '4px'}}>Pesanan baru akan muncul di sini</p>
            </div>
          ) : (
            <div>
              {recentOrders.map((order) => {
                const statusInfo = getStatusBadge(order.status);
                return (
                  <div 
                    key={order.id} 
                    style={styles.orderCard}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#6366F1';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={styles.orderHeader}>
                      <span style={styles.orderNumber}>{order.orderNumber}</span>
                      <span style={{
                        ...styles.badge,
                        background: statusInfo.bg,
                        color: statusInfo.color,
                      }}>
                        {statusInfo.text}
                      </span>
                    </div>
                    <div style={styles.orderDetail}>
                      <FiPhone style={styles.orderIcon} color="#6366F1" />
                      <span>{order.customerName || 'Customer'} - {order.customerPhone}</span>
                    </div>
                    <div style={styles.orderDetail}>
                      <FiMapPin style={styles.orderIcon} color="#10B981" />
                      <span><strong>Jemput:</strong> {order.pickupAddress || '-'}</span>
                    </div>
                    <div style={styles.orderDetail}>
                      <FiMapPin style={styles.orderIcon} color="#EF4444" />
                      <span><strong>Tujuan:</strong> {order.deliveryAddress || '-'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DriverDashboard;
