import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { ordersAPI, driversAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FiFilter, FiEye, FiUser, FiMapPin, FiPhone, FiX,
  FiCheck, FiTruck, FiPackage
} from 'react-icons/fi';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      const [ordersRes, driversRes] = await Promise.all([
        ordersAPI.getAll(statusFilter ? { status: statusFilter } : {}),
        driversAPI.getAvailable()
      ]);
      setOrders(ordersRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (driverId) => {
    try {
      await ordersAPI.assign(selectedOrder.id, driverId);
      toast.success('Driver berhasil ditugaskan');
      setShowAssignModal(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error('Gagal menugaskan driver');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', label: 'Menunggu' },
      assigned: { bg: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)', label: 'Ditugaskan' },
      accepted: { bg: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', label: 'Diterima' },
      picked_up: { bg: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', label: 'Dijemput' },
      on_delivery: { bg: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)', label: 'Diantar' },
      completed: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', label: 'Selesai' },
      cancelled: { bg: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', label: 'Dibatalkan' },
    };
    const c = config[status] || config.pending;
    return (
      <span style={{
        padding: '8px 16px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        background: c.bg,
        color: 'white',
        display: 'inline-block',
      }}>
        {c.label}
      </span>
    );
  };

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'assigned', label: 'Ditugaskan' },
    { value: 'accepted', label: 'Diterima' },
    { value: 'picked_up', label: 'Dijemput' },
    { value: 'on_delivery', label: 'Diantar' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];

  if (loading) {
    return (
      <Layout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manajemen Pesanan</h1>
          <p style={styles.subtitle}>Total {orders.length} pesanan</p>
        </div>
      </div>

      {/* Filter */}
      <div style={styles.filterCard}>
        <div style={styles.filterIcon}>
          <FiFilter size={20} />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.filterSelect}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <FiPackage size={64} style={{ color: '#d1d5db', marginBottom: 16 }} />
          <h3 style={{ color: '#6b7280', margin: 0 }}>Tidak ada pesanan</h3>
          <p style={{ color: '#9ca3af' }}>Pesanan baru akan muncul di sini</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {orders.map((order) => (
            <div key={order.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <span style={styles.orderNumber}>{order.orderNumber}</span>
                  <span style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div style={styles.cardBody}>
                <div style={styles.infoSection}>
                  <div style={styles.infoLabel}>
                    <FiUser size={16} />
                    Customer
                  </div>
                  <div style={styles.infoValue}>{order.customerName || '-'}</div>
                  <div style={styles.infoSub}>
                    <FiPhone size={14} /> {order.customerPhone}
                  </div>
                </div>

                <div style={styles.addressSection}>
                  <div style={styles.addressItem}>
                    <div style={{...styles.addressDot, background: '#10b981'}} />
                    <div>
                      <span style={styles.addressLabel}>Jemput</span>
                      <span style={styles.addressText}>{order.pickupAddress || '-'}</span>
                    </div>
                  </div>
                  <div style={styles.addressLine} />
                  <div style={styles.addressItem}>
                    <div style={{...styles.addressDot, background: '#ef4444'}} />
                    <div>
                      <span style={styles.addressLabel}>Tujuan</span>
                      <span style={styles.addressText}>{order.deliveryAddress || '-'}</span>
                    </div>
                  </div>
                </div>

                {order.driver ? (
                  <div style={styles.driverInfo}>
                    <div style={styles.driverAvatar}>
                      <FiTruck size={18} />
                    </div>
                    <div>
                      <div style={styles.driverName}>{order.driver.name}</div>
                      <div style={styles.driverPhone}>{order.driver.phone}</div>
                    </div>
                  </div>
                ) : (
                  <button 
                    style={styles.assignButton}
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowAssignModal(true);
                    }}
                  >
                    <FiUser size={18} />
                    Tugaskan Driver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Pilih Driver</h2>
              <button 
                style={styles.closeButton}
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedOrder(null);
                }}
              >
                <FiX size={24} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.orderInfo}>
                Order: <strong>{selectedOrder.orderNumber}</strong>
              </p>
              {drivers.length === 0 ? (
                <div style={styles.noDriver}>
                  <FiUser size={32} style={{ color: '#d1d5db' }} />
                  <p>Tidak ada driver yang tersedia</p>
                </div>
              ) : (
                <div style={styles.driverList}>
                  {drivers.map(driver => (
                    <div 
                      key={driver.id} 
                      style={styles.driverOption}
                      onClick={() => handleAssign(driver.id)}
                    >
                      <div style={styles.driverOptionAvatar}>
                        {driver.name.charAt(0)}
                      </div>
                      <div style={styles.driverOptionInfo}>
                        <div style={styles.driverOptionName}>{driver.name}</div>
                        <div style={styles.driverOptionMeta}>
                          {driver.currentOrderCount} order aktif • Prioritas {driver.priorityLevel}/10
                        </div>
                      </div>
                      <FiCheck size={20} style={{ color: '#10b981' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const styles = {
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  subtitle: {
    color: '#6b7280',
    marginTop: 4,
  },
  filterCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'white',
    padding: '12px 20px',
    borderRadius: 16,
    marginBottom: 24,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },
  filterIcon: {
    color: '#9ca3af',
  },
  filterSelect: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    fontSize: 15,
    outline: 'none',
    cursor: 'pointer',
  },
  emptyState: {
    background: 'white',
    borderRadius: 20,
    padding: '64px 32px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: 24,
  },
  card: {
    background: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottom: '1px solid #f3f4f6',
  },
  orderNumber: {
    display: 'block',
    fontSize: 18,
    fontWeight: 700,
    color: '#667eea',
  },
  orderDate: {
    display: 'block',
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  cardBody: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1f2937',
  },
  infoSub: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  addressSection: {
    background: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  addressItem: {
    display: 'flex',
    gap: 12,
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    marginTop: 4,
  },
  addressLine: {
    width: 2,
    height: 24,
    background: '#e5e7eb',
    marginLeft: 5,
    marginTop: 4,
    marginBottom: 4,
  },
  addressLabel: {
    display: 'block',
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 500,
  },
  addressText: {
    display: 'block',
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  driverInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    borderRadius: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: '#10b981',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontWeight: 600,
    color: '#1f2937',
  },
  driverPhone: {
    fontSize: 13,
    color: '#6b7280',
  },
  assignButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    background: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '80vh',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottom: '1px solid #f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  modalBody: {
    padding: 24,
    maxHeight: 400,
    overflowY: 'auto',
  },
  orderInfo: {
    marginBottom: 20,
    color: '#6b7280',
  },
  noDriver: {
    textAlign: 'center',
    padding: '32px 0',
    color: '#9ca3af',
  },
  driverList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  driverOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  driverOptionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
  },
  driverOptionInfo: {
    flex: 1,
  },
  driverOptionName: {
    fontWeight: 600,
    color: '#1f2937',
  },
  driverOptionMeta: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default AdminOrders;
