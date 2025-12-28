import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { driversAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FiPlus, FiEdit2, FiTrash2, FiStar, FiPhone, FiMail,
  FiToggleLeft, FiToggleRight, FiUser, FiX
} from 'react-icons/fi';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    priorityLevel: 5
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await driversAPI.getAll();
      setDrivers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data driver');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDuty = async (driver) => {
    try {
      await driversAPI.toggleDuty(driver.id);
      toast.success(`${driver.name} ${driver.isOnDuty ? 'Off Duty' : 'On Duty'}`);
      fetchDrivers();
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const handleTogglePriority = async (driver) => {
    try {
      await driversAPI.update(driver.id, { isPriority: !driver.isPriority });
      toast.success(`Prioritas ${driver.name} diubah`);
      fetchDrivers();
    } catch (error) {
      toast.error('Gagal mengubah prioritas');
    }
  };

  const handleDelete = async (driver) => {
    if (window.confirm(`Hapus driver ${driver.name}?`)) {
      try {
        await driversAPI.delete(driver.id);
        toast.success('Driver dihapus');
        fetchDrivers();
      } catch (error) {
        toast.error('Gagal menghapus driver');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editDriver) {
        await driversAPI.update(editDriver.id, formData);
        toast.success('Driver diperbarui');
      } else {
        // Register new driver via auth API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role: 'driver' })
        });
        if (!response.ok) throw new Error('Failed');
        toast.success('Driver ditambahkan');
      }
      setShowModal(false);
      setEditDriver(null);
      setFormData({ name: '', email: '', password: '', phone: '', priorityLevel: 5 });
      fetchDrivers();
    } catch (error) {
      toast.error('Gagal menyimpan driver');
    }
  };

  const openEditModal = (driver) => {
    setEditDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone || '',
      priorityLevel: driver.priorityLevel
    });
    setShowModal(true);
  };

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
          <h1 style={styles.title}>Manajemen Driver</h1>
          <p style={styles.subtitle}>Total {drivers.length} driver terdaftar</p>
        </div>
        <button 
          style={styles.addButton}
          onClick={() => {
            setEditDriver(null);
            setFormData({ name: '', email: '', password: '', phone: '', priorityLevel: 5 });
            setShowModal(true);
          }}
        >
          <FiPlus size={20} />
          Tambah Driver
        </button>
      </div>

      <div style={styles.grid}>
        {drivers.map((driver) => (
          <div key={driver.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.avatarContainer}>
                <div style={{
                  ...styles.avatar,
                  background: driver.isOnDuty 
                    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  {driver.name.charAt(0).toUpperCase()}
                </div>
                <div style={{
                  ...styles.statusDot,
                  background: driver.isOnDuty ? '#10b981' : '#ef4444'
                }} />
              </div>
              <div style={styles.cardActions}>
                <button 
                  style={styles.iconButton}
                  onClick={() => openEditModal(driver)}
                  title="Edit"
                >
                  <FiEdit2 size={16} />
                </button>
                <button 
                  style={{...styles.iconButton, ...styles.deleteButton}}
                  onClick={() => handleDelete(driver)}
                  title="Hapus"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>

            <div style={styles.cardBody}>
              <h3 style={styles.driverName}>{driver.name}</h3>
              <div style={styles.infoRow}>
                <FiMail size={14} style={{ color: '#9ca3af' }} />
                <span style={styles.infoText}>{driver.email}</span>
              </div>
              <div style={styles.infoRow}>
                <FiPhone size={14} style={{ color: '#9ca3af' }} />
                <span style={styles.infoText}>{driver.phone || '-'}</span>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{driver.currentOrderCount}</span>
                  <span style={styles.statLabel}>Order Aktif</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{driver.totalOrdersCompleted}</span>
                  <span style={styles.statLabel}>Total Selesai</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{driver.priorityLevel}/10</span>
                  <span style={styles.statLabel}>Prioritas</span>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button
                  style={{
                    ...styles.toggleButton,
                    background: driver.isOnDuty 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : '#e5e7eb',
                    color: driver.isOnDuty ? 'white' : '#6b7280'
                  }}
                  onClick={() => handleToggleDuty(driver)}
                >
                  {driver.isOnDuty ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                  {driver.isOnDuty ? 'On Duty' : 'Off Duty'}
                </button>
                <button
                  style={{
                    ...styles.priorityButton,
                    background: driver.isPriority ? '#fef3c7' : '#f3f4f6',
                    color: driver.isPriority ? '#d97706' : '#9ca3af'
                  }}
                  onClick={() => handleTogglePriority(driver)}
                  title="Toggle Prioritas"
                >
                  <FiStar size={18} fill={driver.isPriority ? '#d97706' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editDriver ? 'Edit Driver' : 'Tambah Driver Baru'}
              </h2>
              <button 
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={styles.input}
                  required
                  disabled={editDriver}
                />
              </div>
              {!editDriver && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    style={styles.input}
                    required={!editDriver}
                  />
                </div>
              )}
              <div style={styles.formGroup}>
                <label style={styles.label}>No. Telepon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Level Prioritas (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.priorityLevel}
                  onChange={(e) => setFormData({...formData, priorityLevel: parseInt(e.target.value)})}
                  style={styles.input}
                />
              </div>
              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editDriver ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    flexWrap: 'wrap',
    gap: 16,
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
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    transition: 'transform 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 24,
  },
  card: {
    background: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 20px 0',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 24,
    fontWeight: 700,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '3px solid white',
  },
  cardActions: {
    display: 'flex',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: 'none',
    background: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  deleteButton: {
    color: '#ef4444',
  },
  cardBody: {
    padding: 20,
  },
  driverName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1f2937',
    margin: '0 0 12px',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 0',
    marginTop: 16,
    borderTop: '1px solid #f3f4f6',
    borderBottom: '1px solid #f3f4f6',
  },
  statItem: {
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: 20,
    fontWeight: 700,
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cardFooter: {
    display: 'flex',
    gap: 12,
    marginTop: 16,
  },
  toggleButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 16px',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  priorityButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
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
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: 4,
  },
  formGroup: {
    padding: '0 24px',
    marginTop: 20,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: 12,
    fontSize: 15,
    transition: 'border-color 0.2s',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modalFooter: {
    display: 'flex',
    gap: 12,
    padding: 24,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    padding: '14px 24px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
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

export default AdminDrivers;
