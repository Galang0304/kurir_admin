import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ordersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, subscribeToOrders, unsubscribeFromOrders } from '../../services/socket';
import { toast } from 'react-toastify';
import { FiCheck, FiX, FiPhone, FiMapPin, FiClock, FiUser, FiFileText, FiChevronRight } from 'react-icons/fi';

const DriverOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchOrders();
    
    connectSocket();
    subscribeToOrders((order) => {
      if (order.driverId === user?.id) {
        fetchOrders();
      }
    });

    return () => {
      unsubscribeFromOrders();
    };
  }, [user?.id]);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getByDriver(user.id);
      setOrders(res.data);
    } catch (error) {
      toast.error('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    setProcessingId(orderId);
    try {
      await ordersAPI.updateStatus(orderId, status);
      toast.success('Status berhasil diupdate!');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Gagal update status');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Menunggu', icon: '⏳' },
      assigned: { bg: '#DBEAFE', color: '#1E40AF', text: 'Ditugaskan', icon: '📋' },
      accepted: { bg: '#D1FAE5', color: '#065F46', text: 'Diterima', icon: '✅' },
      picked_up: { bg: '#E0E7FF', color: '#3730A3', text: 'Dijemput', icon: '📦' },
      on_delivery: { bg: '#FEE2E2', color: '#DC2626', text: 'Diantar', icon: '🚗' },
      completed: { bg: '#D1FAE5', color: '#065F46', text: 'Selesai', icon: '🎉' },
      cancelled: { bg: '#FEE2E2', color: '#991B1B', text: 'Dibatalkan', icon: '❌' }
    };
    return statusMap[status] || { bg: '#F3F4F6', color: '#374151', text: status, icon: '📄' };
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      assigned: { next: 'accepted', label: 'Terima Pesanan', icon: '✅', color: '#10B981' },
      accepted: { next: 'picked_up', label: 'Sudah Jemput', icon: '📦', color: '#6366F1' },
      picked_up: { next: 'on_delivery', label: 'Mulai Antar', icon: '🚗', color: '#F59E0B' },
      on_delivery: { next: 'completed', label: 'Selesai', icon: '🎉', color: '#10B981' }
    };
    return flow[currentStatus] || null;
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') {
      return ['assigned', 'accepted', 'picked_up', 'on_delivery'].includes(order.status);
    }
    if (filter === 'completed') {
      return order.status === 'completed';
    }
    if (filter === 'cancelled') {
      return order.status === 'cancelled';
    }
    return true;
  });

  const activeCount = orders.filter(o => ['assigned', 'accepted', 'picked_up', 'on_delivery'].includes(o.status)).length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: '8px',
    },
    subtitle: {
      fontSize: '16px',
      color: '#6B7280',
    },
    filterCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #F3F4F6',
    },
    filterContainer: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '12px 20px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    filterActive: {
      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
    },
    filterInactive: {
      background: '#F3F4F6',
      color: '#6B7280',
    },
    filterBadge: {
      background: 'rgba(255,255,255,0.3)',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '12px',
    },
    filterBadgeInactive: {
      background: '#E5E7EB',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '12px',
    },
    emptyState: {
      background: 'white',
      borderRadius: '20px',
      padding: '60px 24px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '16px',
    },
    emptyTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px',
    },
    emptySubtitle: {
      fontSize: '14px',
      color: '#9CA3AF',
    },
    ordersList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    orderCard: {
      background: 'white',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #F3F4F6',
      transition: 'all 0.3s ease',
    },
    orderHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px',
    },
    orderNumberContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    orderNumber: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1F2937',
    },
    badge: {
      padding: '6px 14px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    orderTime: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: '#9CA3AF',
      fontSize: '13px',
    },
    orderBody: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '20px',
    },
    infoBox: {
      background: '#F9FAFB',
      borderRadius: '12px',
      padding: '16px',
    },
    infoLabel: {
      fontSize: '12px',
      color: '#9CA3AF',
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: '600',
    },
    infoValue: {
      fontSize: '15px',
      color: '#1F2937',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    addressSection: {
      background: '#F9FAFB',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
    },
    addressItem: {
      display: 'flex',
      gap: '14px',
      marginBottom: '16px',
    },
    addressIcon: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    addressContent: {
      flex: 1,
    },
    addressLabel: {
      fontSize: '12px',
      color: '#9CA3AF',
      marginBottom: '4px',
      fontWeight: '600',
    },
    addressText: {
      fontSize: '15px',
      color: '#1F2937',
      fontWeight: '500',
    },
    addressDivider: {
      height: '24px',
      width: '2px',
      background: '#E5E7EB',
      marginLeft: '17px',
      marginBottom: '16px',
    },
    actionButtons: {
      display: 'flex',
      gap: '12px',
      paddingTop: '20px',
      borderTop: '1px solid #F3F4F6',
    },
    actionButton: {
      flex: 1,
      padding: '14px 24px',
      borderRadius: '12px',
      border: 'none',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
    },
    dangerButton: {
      background: '#FEE2E2',
      color: '#DC2626',
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      backdropFilter: 'blur(4px)',
    },
    modalContent: {
      background: 'white',
      borderRadius: '24px',
      padding: '32px',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
    },
    modalIcon: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: '#FEE2E2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      fontSize: '28px',
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1F2937',
      textAlign: 'center',
      marginBottom: '12px',
    },
    modalText: {
      fontSize: '15px',
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: '24px',
    },
    modalButtons: {
      display: 'flex',
      gap: '12px',
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
    phoneLink: {
      color: '#6366F1',
      textDecoration: 'none',
      fontWeight: '600',
    },
  };

  if (loading) {
    return (
      <Layout title="Pesanan">
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Pesanan Saya">
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>📦 Pesanan Saya</h1>
          <p style={styles.subtitle}>Kelola semua pesanan Anda di sini</p>
        </div>

        {/* Filter */}
        <div style={styles.filterCard}>
          <div style={styles.filterContainer}>
            <button
              onClick={() => setFilter('active')}
              style={{
                ...styles.filterButton,
                ...(filter === 'active' ? styles.filterActive : styles.filterInactive)
              }}
            >
              🚗 Aktif
              <span style={filter === 'active' ? styles.filterBadge : styles.filterBadgeInactive}>
                {activeCount}
              </span>
            </button>
            <button
              onClick={() => setFilter('completed')}
              style={{
                ...styles.filterButton,
                ...(filter === 'completed' ? styles.filterActive : styles.filterInactive)
              }}
            >
              ✅ Selesai
              <span style={filter === 'completed' ? styles.filterBadge : styles.filterBadgeInactive}>
                {completedCount}
              </span>
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              style={{
                ...styles.filterButton,
                ...(filter === 'cancelled' ? styles.filterActive : styles.filterInactive)
              }}
            >
              ❌ Dibatalkan
              <span style={filter === 'cancelled' ? styles.filterBadge : styles.filterBadgeInactive}>
                {cancelledCount}
              </span>
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              {filter === 'active' ? '📭' : filter === 'completed' ? '📋' : '🚫'}
            </div>
            <div style={styles.emptyTitle}>
              {filter === 'active' ? 'Tidak ada pesanan aktif' : 
               filter === 'completed' ? 'Belum ada pesanan selesai' : 
               'Tidak ada pesanan dibatalkan'}
            </div>
            <div style={styles.emptySubtitle}>
              {filter === 'active' ? 'Pesanan baru akan muncul di sini' : 
               filter === 'completed' ? 'Pesanan yang sudah selesai akan tampil di sini' : 
               'Pesanan yang dibatalkan akan tampil di sini'}
            </div>
          </div>
        ) : (
          <div style={styles.ordersList}>
            {filteredOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              const nextStatus = getNextStatus(order.status);
              const isProcessing = processingId === order.id;

              return (
                <div 
                  key={order.id} 
                  style={styles.orderCard}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Header */}
                  <div style={styles.orderHeader}>
                    <div style={styles.orderNumberContainer}>
                      <span style={styles.orderNumber}>{order.orderNumber}</span>
                      <span style={{
                        ...styles.badge,
                        background: statusInfo.bg,
                        color: statusInfo.color,
                      }}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </div>
                    <div style={styles.orderTime}>
                      <FiClock size={14} />
                      {new Date(order.createdAt).toLocaleString('id-ID')}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={styles.orderBody}>
                    <div style={styles.infoBox}>
                      <div style={styles.infoLabel}>Customer</div>
                      <div style={styles.infoValue}>
                        <FiUser color="#6366F1" />
                        {order.customerName || '-'}
                      </div>
                    </div>
                    <div style={styles.infoBox}>
                      <div style={styles.infoLabel}>Telepon</div>
                      <div style={styles.infoValue}>
                        <FiPhone color="#10B981" />
                        <a href={`tel:${order.customerPhone}`} style={styles.phoneLink}>
                          {order.customerPhone}
                        </a>
                      </div>
                    </div>
                    {order.notes && (
                      <div style={styles.infoBox}>
                        <div style={styles.infoLabel}>Catatan</div>
                        <div style={styles.infoValue}>
                          <FiFileText color="#F59E0B" />
                          {order.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address Section */}
                  <div style={styles.addressSection}>
                    <div style={styles.addressItem}>
                      <div style={{...styles.addressIcon, background: '#D1FAE5'}}>
                        <FiMapPin color="#10B981" />
                      </div>
                      <div style={styles.addressContent}>
                        <div style={styles.addressLabel}>Alamat Jemput</div>
                        <div style={styles.addressText}>{order.pickupAddress || '-'}</div>
                      </div>
                    </div>
                    <div style={styles.addressDivider}></div>
                    <div style={styles.addressItem}>
                      <div style={{...styles.addressIcon, background: '#FEE2E2'}}>
                        <FiMapPin color="#EF4444" />
                      </div>
                      <div style={styles.addressContent}>
                        <div style={styles.addressLabel}>Alamat Tujuan</div>
                        <div style={styles.addressText}>{order.deliveryAddress || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {nextStatus && (
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleUpdateStatus(order.id, nextStatus.next)}
                        disabled={isProcessing}
                        style={{
                          ...styles.actionButton,
                          ...styles.primaryButton,
                          background: `linear-gradient(135deg, ${nextStatus.color} 0%, ${nextStatus.color}dd 100%)`,
                          opacity: isProcessing ? 0.7 : 1,
                        }}
                      >
                        {isProcessing ? (
                          <>
                            <div style={{...styles.spinner, width: '20px', height: '20px', borderWidth: '2px'}}></div>
                            Memproses...
                          </>
                        ) : (
                          <>
                            {nextStatus.icon} {nextStatus.label}
                            <FiChevronRight />
                          </>
                        )}
                      </button>
                      {order.status === 'assigned' && (
                        <button
                          onClick={() => setSelectedOrder(order)}
                          disabled={isProcessing}
                          style={{
                            ...styles.actionButton,
                            ...styles.dangerButton,
                            flex: 'none',
                            padding: '14px 20px',
                          }}
                        >
                          <FiX /> Tolak
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Modal */}
        {selectedOrder && (
          <div style={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalIcon}>⚠️</div>
              <div style={styles.modalTitle}>Tolak Pesanan?</div>
              <div style={styles.modalText}>
                Yakin ingin menolak pesanan <strong>{selectedOrder.orderNumber}</strong>? 
                Aksi ini tidak dapat dibatalkan.
              </div>
              <div style={styles.modalButtons}>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    ...styles.actionButton,
                    background: '#F3F4F6',
                    color: '#374151',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                  style={{
                    ...styles.actionButton,
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Ya, Tolak
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DriverOrders;
